from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.document import DocumentType


class DocumentCreate(BaseModel):
    name: str
    type: DocumentType
    content_md: str = ""


class DocumentUpdate(BaseModel):
    name: str | None = None
    content_md: str | None = None


class DocumentBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: DocumentType


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    type: DocumentType
    content_md: str
    created_at: datetime
    updated_at: datetime
