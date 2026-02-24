import uuid
from datetime import datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    owner_id: uuid.UUID
    created_at: datetime
    image_count: int = 0
    annotation_count: int = 0
    member_count: int = 0

    model_config = {"from_attributes": True}


class ProjectClassCreate(BaseModel):
    name: str
    color: str


class ProjectClassUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class ProjectClassResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    class_index: int
    color: str

    model_config = {"from_attributes": True}


class ProjectMemberAdd(BaseModel):
    user_id: uuid.UUID
    role: str = "annotator"


class ProjectMemberResponse(BaseModel):
    user_id: uuid.UUID
    username: str
    email: str
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}
