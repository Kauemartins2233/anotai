import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.schemas.export import DatasetSplitRequest
from app.services.export_service import auto_split_dataset, generate_yolo_export
from app.api.deps import get_current_admin
from sqlalchemy import select

router = APIRouter(prefix="/api/projects/{project_id}/export", tags=["export"])


@router.post("/split")
async def split_dataset(
    project_id: uuid.UUID,
    data: DatasetSplitRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    await auto_split_dataset(db, project_id, data.train_ratio)
    return {"message": "Dataset split completed"}


@router.post("/download")
async def export_dataset(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    zip_buffer = await generate_yolo_export(db, project_id)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={project.name}_dataset.zip"},
    )
