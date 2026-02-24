import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.project import Project, ProjectClass, ProjectMember
from app.models.image import Image, ImageAssignment
from app.models.annotation import Annotation
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectClassCreate, ProjectClassUpdate, ProjectClassResponse,
    ProjectMemberAdd, ProjectMemberResponse,
)
from app.api.deps import get_current_user, get_current_admin, get_project_member_or_admin

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_admin:
        result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    else:
        result = await db.execute(
            select(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(ProjectMember.user_id == current_user.id)
            .order_by(Project.created_at.desc())
        )
    projects = result.scalars().all()

    response = []
    for p in projects:
        img_count = await db.execute(
            select(func.count(Image.id)).where(Image.project_id == p.id)
        )
        ann_count = await db.execute(
            select(func.count(Annotation.id))
            .join(Image, Annotation.image_id == Image.id)
            .where(Image.project_id == p.id)
        )
        member_count = await db.execute(
            select(func.count(ProjectMember.user_id)).where(ProjectMember.project_id == p.id)
        )
        resp = ProjectResponse.model_validate(p)
        resp.image_count = img_count.scalar() or 0
        resp.annotation_count = ann_count.scalar() or 0
        resp.member_count = member_count.scalar() or 0
        response.append(resp)

    return response


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    project = Project(name=data.name, description=data.description, owner_id=current_user.id)
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_project_member_or_admin),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    img_count = await db.execute(
        select(func.count(Image.id)).where(Image.project_id == project.id)
    )
    ann_count = await db.execute(
        select(func.count(Annotation.id))
        .join(Image, Annotation.image_id == Image.id)
        .where(Image.project_id == project.id)
    )
    member_count = await db.execute(
        select(func.count(ProjectMember.user_id)).where(ProjectMember.project_id == project.id)
    )
    resp = ProjectResponse.model_validate(project)
    resp.image_count = img_count.scalar() or 0
    resp.annotation_count = ann_count.scalar() or 0
    resp.member_count = member_count.scalar() or 0
    return resp


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description

    await db.flush()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)


# --- Project Members ---

@router.get("/{project_id}/members", response_model=list[ProjectMemberResponse])
async def list_members(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_project_member_or_admin),
):
    result = await db.execute(
        select(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at)
    )
    rows = result.all()
    return [
        ProjectMemberResponse(
            user_id=member.user_id,
            username=user.username,
            email=user.email,
            role=member.role,
            joined_at=member.joined_at,
        )
        for member, user in rows
    ]


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: uuid.UUID,
    data: ProjectMemberAdd,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    # Verify project exists
    proj = await db.execute(select(Project).where(Project.id == project_id))
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == data.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check not already member
    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == data.user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already a member")

    member = ProjectMember(project_id=project_id, user_id=data.user_id, role=data.role)
    db.add(member)
    await db.flush()
    await db.refresh(member)

    return ProjectMemberResponse(
        user_id=member.user_id,
        username=user.username,
        email=user.email,
        role=member.role,
        joined_at=member.joined_at,
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Also remove image assignments for this user in this project
    images_result = await db.execute(
        select(Image.id).where(Image.project_id == project_id)
    )
    image_ids = [row[0] for row in images_result.all()]
    if image_ids:
        assignments = await db.execute(
            select(ImageAssignment).where(
                ImageAssignment.image_id.in_(image_ids),
                ImageAssignment.user_id == user_id,
            )
        )
        for assignment in assignments.scalars().all():
            await db.delete(assignment)

    await db.delete(member)


# --- Project Classes ---

@router.get("/{project_id}/classes", response_model=list[ProjectClassResponse])
async def list_classes(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_project_member_or_admin),
):
    result = await db.execute(
        select(ProjectClass)
        .where(ProjectClass.project_id == project_id)
        .order_by(ProjectClass.class_index)
    )
    return result.scalars().all()


@router.post("/{project_id}/classes", response_model=ProjectClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    project_id: uuid.UUID,
    data: ProjectClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    proj = await db.execute(select(Project).where(Project.id == project_id))
    if not proj.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Project not found")

    max_idx = await db.execute(
        select(func.max(ProjectClass.class_index)).where(ProjectClass.project_id == project_id)
    )
    next_index = (max_idx.scalar() or -1) + 1

    cls = ProjectClass(
        project_id=project_id,
        name=data.name,
        class_index=next_index,
        color=data.color,
    )
    db.add(cls)
    await db.flush()
    await db.refresh(cls)
    return cls


@router.put("/{project_id}/classes/{class_id}", response_model=ProjectClassResponse)
async def update_class(
    project_id: uuid.UUID,
    class_id: uuid.UUID,
    data: ProjectClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(ProjectClass).where(ProjectClass.id == class_id, ProjectClass.project_id == project_id)
    )
    cls = result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    if data.name is not None:
        cls.name = data.name
    if data.color is not None:
        cls.color = data.color

    await db.flush()
    await db.refresh(cls)
    return cls


@router.delete("/{project_id}/classes/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    project_id: uuid.UUID,
    class_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    result = await db.execute(
        select(ProjectClass).where(ProjectClass.id == class_id, ProjectClass.project_id == project_id)
    )
    cls = result.scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")
    await db.delete(cls)
