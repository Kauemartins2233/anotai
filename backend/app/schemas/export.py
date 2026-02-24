from pydantic import BaseModel


class ExportRequest(BaseModel):
    pass


class DatasetSplitRequest(BaseModel):
    train_ratio: float = 0.8
