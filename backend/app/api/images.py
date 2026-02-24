import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectMember
from app.models.image import Image, ImageAssignment
from app.models.annotation import Annotation
from app.schemas.image import ImageResponse, ImageSplitUpdate, ImageAssignRequest, ImageAutoAssignRequest, AssignmentStatsItem
from app.services.image_service import save_uploaded_image
from app.api.deps import get_current_user, get_current_admin, get_current_user_from_token_param

router = APIRouter(prefix="/api/projects/{project_id}/images", tags=["images"])


async def _verify_project_access(project_id: uuid.UUID, user: User, db: AsyncSession) -> Project:
    """Verify project exists and user has access (admin or member)."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not user.is_admin:
        member = await db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user.id,
            )
        )
        if member.scalar_one_or_none() is None:
            raise HTTPException(status_code=403, detail="Not a member of this project")

    return project


async def _build_image_response(img: Image, db: AsyncSession) -> ImageResponse:
    ann_count_result = await db.execute(
        select(func.count(Annotation.id)).where(Annotation.image_id == img.id)
    )
    resp = ImageResponse.model_validate(img)
    resp.annotation_count = ann_count_result.scalar() or 0

    assignment_result = await db.execute(
        select(User.username)
        .join(ImageAssignment, ImageAssignment.user_id == User.id)
        .where(ImageAssignment.image_id == img.id)
    )
    resp.assigned_to = assignment_result.scalar_one_or_none()
    return resp


# ---- Fixed routes MUST come before /{image_id} routes ----

@router.get("/unassigned", response_model=list[ImageResponse])
async def list_unassigned(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """List images without assignments."""
    assigned_image_ids = select(ImageAssignment.image_id)
    result = await db.execute(
        select(Image)
        .where(Image.project_id == project_id, Image.id.notin_(assigned_image_ids))
        .order_by(Image.uploaded_at.desc())
    )
    images = result.scalars().all()
    response = []
    for img in images:
        response.append(await _build_image_response(img, db))
    return response


@router.get("/stats", response_model=list[AssignmentStatsItem])
async def assignment_stats(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Get assignment statistics per annotator."""
    members_result = await db.execute(
        select(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
    )
    members = members_result.all()

    stats = []
    for member, user in members:
        assigned_count = await db.execute(
            select(func.count(ImageAssignment.image_id))
            .join(Image, ImageAssignment.image_id == Image.id)
            .where(Image.project_id == project_id, ImageAssignment.user_id == user.id)
        )

        annotated_count = await db.execute(
            select(func.count(func.distinct(Image.id)))
            .join(ImageAssignment, ImageAssignment.image_id == Image.id)
            .join(Annotation, Annotation.image_id == Image.id)
            .where(Image.project_id == project_id, ImageAssignment.user_id == user.id)
        )

        stats.append(AssignmentStatsItem(
            user_id=user.id,
            username=user.username,
            assigned=assigned_count.scalar() or 0,
            annotated=annotated_count.scalar() or 0,
        ))

    return stats


@router.post("/assign", status_code=status.HTTP_200_OK)
async def assign_images(
    project_id: uuid.UUID,
    data: ImageAssignRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Manually assign specific images to a user."""
    member = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == data.user_id,
        )
    )
    if member.scalar_one_or_none() is None:
        raise HTTPException(status_code=400, detail="User is not a member of this project")

    assigned = 0
    for image_id in data.image_ids:
        img = await db.execute(
            select(Image).where(Image.id == image_id, Image.project_id == project_id)
        )
        if img.scalar_one_or_none() is None:
            continue

        await db.execute(delete(ImageAssignment).where(ImageAssignment.image_id == image_id))

        assignment = ImageAssignment(image_id=image_id, user_id=data.user_id)
        db.add(assignment)
        assigned += 1

    await db.flush()
    return {"assigned": assigned}


@router.post("/auto-assign", status_code=status.HTTP_200_OK)
async def auto_assign_images(
    project_id: uuid.UUID,
    data: ImageAutoAssignRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Auto-distribute unassigned images among specified users."""
    for uid in data.user_ids:
        member = await db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == uid,
            )
        )
        if member.scalar_one_or_none() is None:
            raise HTTPException(status_code=400, detail=f"User {uid} is not a member of this project")

    assigned_image_ids = select(ImageAssignment.image_id)
    result = await db.execute(
        select(Image)
        .where(Image.project_id == project_id, Image.id.notin_(assigned_image_ids))
        .order_by(Image.uploaded_at)
    )
    unassigned = result.scalars().all()

    if not unassigned:
        return {"assigned": 0}

    if data.count_per_user:
        max_total = data.count_per_user * len(data.user_ids)
        unassigned = unassigned[:max_total]

    assigned = 0
    for i, img in enumerate(unassigned):
        user_id = data.user_ids[i % len(data.user_ids)]
        assignment = ImageAssignment(image_id=img.id, user_id=user_id)
        db.add(assignment)
        assigned += 1

    await db.flush()
    return {"assigned": assigned}


# ---- Standard CRUD routes ----

@router.get("", response_model=list[ImageResponse])
async def list_images(
    project_id: uuid.UUID,
    skip: int = 0,
    limit: int = 1000,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_project_access(project_id, current_user, db)

    if current_user.is_admin:
        query = (
            select(Image)
            .where(Image.project_id == project_id)
            .order_by(Image.uploaded_at.desc())
            .offset(skip)
            .limit(limit)
        )
    else:
        query = (
            select(Image)
            .join(ImageAssignment, ImageAssignment.image_id == Image.id)
            .where(Image.project_id == project_id, ImageAssignment.user_id == current_user.id)
            .order_by(Image.uploaded_at.desc())
            .offset(skip)
            .limit(limit)
        )

    result = await db.execute(query)
    images = result.scalars().all()

    response = []
    for img in images:
        response.append(await _build_image_response(img, db))

    return response


@router.post("", response_model=list[ImageResponse], status_code=status.HTTP_201_CREATED)
async def upload_images(
    project_id: uuid.UUID,
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    proj = await db.execute(select(Project).where(Project.id == project_id))
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    created_images = []
    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            continue

        info = await save_uploaded_image(file, project_id)
        image = Image(
            project_id=project_id,
            filename=info["filename"],
            storage_path=info["storage_path"],
            thumbnail_path=info["thumbnail_path"],
            width=info["width"],
            height=info["height"],
            file_size=info["file_size"],
        )
        db.add(image)
        await db.flush()
        await db.refresh(image)
        created_images.append(ImageResponse.model_validate(image))

    return created_images


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _verify_project_access(project_id, current_user, db)
    result = await db.execute(select(Image).where(Image.id == image_id, Image.project_id == project_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return await _build_image_response(image, db)


@router.get("/{image_id}/file")
async def serve_image_file(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token_param),
):
    await _verify_project_access(project_id, current_user, db)
    result = await db.execute(select(Image).where(Image.id == image_id, Image.project_id == project_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    path = Path(image.storage_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(path, media_type="image/jpeg")


@router.get("/{image_id}/thumbnail")
async def serve_thumbnail(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token_param),
):
    await _verify_project_access(project_id, current_user, db)
    result = await db.execute(select(Image).where(Image.id == image_id, Image.project_id == project_id))
    image = result.scalar_one_or_none()
    if not image or not image.thumbnail_path:
        raise HTTPException(status_code=404, detail="Thumbnail not found")

    path = Path(image.thumbnail_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail file not found")

    return FileResponse(path, media_type="image/jpeg")


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(Image).where(Image.id == image_id, Image.project_id == project_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    for path_str in [image.storage_path, image.thumbnail_path]:
        if path_str:
            path = Path(path_str)
            if path.exists():
                path.unlink()

    await db.delete(image)


@router.patch("/{image_id}/split", response_model=ImageResponse)
async def update_split(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    data: ImageSplitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(Image).where(Image.id == image_id, Image.project_id == project_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    image.dataset_split = data.dataset_split
    await db.flush()
    await db.refresh(image)
    return ImageResponse.model_validate(image)


@router.delete("/{image_id}/assignment", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_image(
    project_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Remove assignment from an image."""
    result = await db.execute(
        select(ImageAssignment).where(ImageAssignment.image_id == image_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(assignment)
