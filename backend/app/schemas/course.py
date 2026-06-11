from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from .user import UserBrief


class CourseBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None


class CourseResponse(CourseBase):
    id: UUID
    instructor_id: UUID
    is_published: bool
    created_at: datetime
    updated_at: datetime
    lesson_count: int = 0
    student_count: int = 0
    problems_count: int = 0

    class Config:
        from_attributes = True


class CourseDetailResponse(CourseResponse):
    instructor: UserBrief


class CourseListResponse(BaseModel):
    courses: list[CourseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Enrollment schemas
class EnrollmentCreate(BaseModel):
    course_id: UUID


class EnrollmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    course_id: UUID
    status: str
    progress: int
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnrollmentWithCourse(BaseModel):
    id: UUID
    course: CourseResponse
    status: str
    progress: int
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnrollmentListResponse(BaseModel):
    enrollments: list[EnrollmentWithCourse]
    total: int
    page: int
    page_size: int
    total_pages: int
