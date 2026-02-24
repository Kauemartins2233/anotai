import uuid
from datetime import datetime

from pydantic import BaseModel


class Vertex(BaseModel):
    x: float
    y: float


class AnnotationCreate(BaseModel):
    class_id: uuid.UUID
    vertices: list[Vertex]


class AnnotationUpdate(BaseModel):
    class_id: uuid.UUID | None = None
    vertices: list[Vertex] | None = None


class AnnotationResponse(BaseModel):
    id: uuid.UUID
    image_id: uuid.UUID
    class_id: uuid.UUID
    vertices: list[Vertex]
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkAnnotationSave(BaseModel):
    annotations: list[AnnotationCreate]
