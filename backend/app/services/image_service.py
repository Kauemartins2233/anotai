import os
import uuid
from pathlib import Path

from PIL import Image as PILImage
from fastapi import UploadFile

from app.config import settings


async def save_uploaded_image(file: UploadFile, project_id: uuid.UUID) -> dict:
    upload_dir = Path(settings.UPLOAD_DIR) / str(project_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    thumb_dir = upload_dir / "thumbnails"
    thumb_dir.mkdir(exist_ok=True)

    file_id = uuid.uuid4()
    ext = Path(file.filename).suffix.lower() or ".jpg"
    storage_name = f"{file_id}{ext}"
    storage_path = upload_dir / storage_name
    thumb_path = thumb_dir / f"{file_id}_thumb.jpg"

    content = await file.read()
    with open(storage_path, "wb") as f:
        f.write(content)

    img = PILImage.open(storage_path)
    width, height = img.size

    # Generate thumbnail
    thumb_size = (300, 300)
    img_copy = img.copy()
    img_copy.thumbnail(thumb_size)
    if img_copy.mode in ("RGBA", "P"):
        img_copy = img_copy.convert("RGB")
    img_copy.save(thumb_path, "JPEG", quality=85)
    img.close()
    img_copy.close()

    return {
        "filename": file.filename,
        "storage_path": str(storage_path),
        "thumbnail_path": str(thumb_path),
        "width": width,
        "height": height,
        "file_size": len(content),
    }
