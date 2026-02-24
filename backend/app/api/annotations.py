import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.image import Image, ImageAssignment
from app.models.annotation import Annotation
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse, BulkAnnotationSave
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/api/projects/{project_id}/images/{image_id}/annotations",
    tags=["annotations"],
)


async def _verify_image(project_id: uuid.UUID, image_id: uuid.UUID, user: User, db: AsyncSession) -> Image:
    """Verify project access and image exists. Admin can access any image, annotators only assigned images."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not user.is_admin:
        # Check membership
        member = await db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user.id,
            )
        )
        if member.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Not a member of this project")

    img_result = await db.execute(select(Image).where(Image.id == image_id, Image.project_id == project_id))
    image = img_result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    if not user.is_admin:
        # Check image is assigned to this user
        assignment = await db.execute(
            select(ImageAssignment).where(
                ImageAssignment.image_id == image_id,
                ImageAssignment.user_id == user.id,
            )
        )
        if assignment.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Image not assigned to you")

    return image


@router.get("", response_model=list[AnnotationResponse])
async def list_annotations(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_image(project_id, image_id, current_user, db)
    result = await db.execute(
        select(Annotation).where(Annotation.image_id == image_id).order_by(Annotation.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def create_annotation(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    data: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_image(project_id, image_id, current_user, db)

    annotation = Annotation(
        image_id=image_id,
        class_id=data.class_id,
        vertices=[{"x": v.x, "y": v.y} for v in data.vertices],
        created_by=current_user.id,
    )
    db.add(annotation)
    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.put("/{annotation_id}", response_model=AnnotationResponse)
async def update_annotation(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    annotation_id: uuid.UUID,
    data: AnnotationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_image(project_id, image_id, current_user, db)
    result = await db.execute(
        select(Annotation).where(Annotation.id == annotation_id, Annotation.image_id == image_id)
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    if data.class_id is not None:
        annotation.class_id = data.class_id
    if data.vertices is not None:
        annotation.vertices = [{"x": v.x, "y": v.y} for v in data.vertices]

    await db.flush()
    await db.refresh(annotation)
    return annotation


@router.delete("/{annotation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_annotation(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    annotation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_image(project_id, image_id, current_user, db)
    result = await db.execute(
        select(Annotation).where(Annotation.id == annotation_id, Annotation.image_id == image_id)
    )
    annotation = result.scalar_one_or_none()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    await db.delete(annotation)


@router.put("", response_model=list[AnnotationResponse])
async def bulk_save_annotations(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    data: BulkAnnotationSave,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Replace all annotations for an image atomically."""
    await _verify_image(project_id, image_id, current_user, db)

    await db.execute(delete(Annotation).where(Annotation.image_id == image_id))

    created = []
    for ann_data in data.annotations:
        annotation = Annotation(
            image_id=image_id,
            class_id=ann_data.class_id,
            vertices=[{"x": v.x, "y": v.y} for v in ann_data.vertices],
            created_by=current_user.id,
        )
        db.add(annotation)
        await db.flush()
        await db.refresh(annotation)
        created.append(annotation)

    return created
