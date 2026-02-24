import io
import os
import random
import uuid
import zipfile
from pathlib import Path

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.image import Image
from app.models.annotation import Annotation
from app.models.project import Project, ProjectClass


async def auto_split_dataset(db: AsyncSession, project_id: uuid.UUID, train_ratio: float = 0.8):
    result = await db.execute(select(Image).where(Image.project_id == project_id))
    images = list(result.scalars().all())
    random.shuffle(images)

    split_point = int(len(images) * train_ratio)
    for i, img in enumerate(images):
        img.dataset_split = "train" if i < split_point else "val"

    await db.flush()


async def generate_yolo_export(db: AsyncSession, project_id: uuid.UUID) -> io.BytesIO:
    # Fetch project with classes
    proj_result = await db.execute(select(Project).where(Project.id == project_id))
    project = proj_result.scalar_one_or_none()
    if not project:
        raise ValueError("Project not found")

    classes_result = await db.execute(
        select(ProjectClass)
        .where(ProjectClass.project_id == project_id)
        .order_by(ProjectClass.class_index)
    )
    classes = list(classes_result.scalars().all())
    class_map = {str(c.id): c.class_index for c in classes}

    # Fetch all images with annotations
    images_result = await db.execute(
        select(Image)
        .where(Image.project_id == project_id)
        .options(selectinload(Image.annotations))
    )
    images = list(images_result.scalars().all())

    # Build zip in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Generate data.yaml
        class_names = {c.class_index: c.name for c in classes}
        yaml_content = "path: .\n"
        yaml_content += "train: images/train\n"
        yaml_content += "val: images/val\n\n"
        yaml_content += "names:\n"
        for idx in sorted(class_names.keys()):
            yaml_content += f"  {idx}: {class_names[idx]}\n"
        zf.writestr("data.yaml", yaml_content)

        for img in images:
            split = img.dataset_split or "train"
            stem = Path(img.filename).stem
            ext = Path(img.filename).suffix or ".jpg"

            # Add image file
            img_path = Path(img.storage_path)
            if img_path.exists():
                zf.write(str(img_path), f"images/{split}/{stem}{ext}")

            # Generate label file
            label_lines = []
            for ann in img.annotations:
                class_idx = class_map.get(str(ann.class_id))
                if class_idx is None:
                    continue

                vertices = ann.vertices
                coords = []
                for v in vertices:
                    coords.append(f"{v['x']:.6f}")
                    coords.append(f"{v['y']:.6f}")

                label_lines.append(f"{class_idx} {' '.join(coords)}")

            if label_lines:
                zf.writestr(f"labels/{split}/{stem}.txt", "\n".join(label_lines) + "\n")

    zip_buffer.seek(0)
    return zip_buffer
