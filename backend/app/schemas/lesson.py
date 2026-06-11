from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from ..models.lesson import LessonType


class LessonBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: LessonType
    order: int = 0
    duration_minutes: Optional[int] = None
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_provider: str = "local"
    is_published: bool = False
    published_at: Optional[datetime] = None


class LessonCreate(LessonBase):
    course_id: UUID


class LessonUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    lesson_type: Optional[LessonType] = None
    order: Optional[int] = None
    duration_minutes: Optional[int] = None
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_provider: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None


class LessonResponse(LessonBase):
    id: UUID
    course_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LessonDetailResponse(LessonResponse):
    documents: list["DocumentResponse"] = []


class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    file_url: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    storage_provider: str = "local"


class DocumentCreate(DocumentBase):
    lesson_id: UUID


class DocumentResponse(DocumentBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LessonListResponse(BaseModel):
    lessons: list[LessonResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
