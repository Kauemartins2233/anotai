import uuid
from datetime import datetime

from pydantic import BaseModel


class ImageResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    filename: str
    width: int
    height: int
    file_size: int
    dataset_split: str | None
    uploaded_at: datetime
    annotation_count: int = 0
    assigned_to: str | None = None

    model_config = {"from_attributes": True}


class ImageSplitUpdate(BaseModel):
    dataset_split: str | None  # "train", "val", or null


class ImageAssignRequest(BaseModel):
    user_id: uuid.UUID
    image_ids: list[uuid.UUID]


class ImageAutoAssignRequest(BaseModel):
    user_ids: list[uuid.UUID]
    count_per_user: int | None = None


class AssignmentStatsItem(BaseModel):
    user_id: uuid.UUID
    username: str
    assigned: int
    annotated: int
