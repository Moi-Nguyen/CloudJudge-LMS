from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from ..models.problem import SubmissionStatus


class ProblemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=1)
    starter_code: Optional[str] = None
    language: str = "python"
    time_limit: int = Field(default=2000, ge=100, le=30000)  # ms
    memory_limit: int = Field(default=256, ge=16, le=1024)  # MB
    difficulty: str = "medium"


class ProblemCreate(ProblemBase):
    lesson_id: UUID


class ProblemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    starter_code: Optional[str] = None
    time_limit: Optional[int] = Field(None, ge=100, le=30000)
    memory_limit: Optional[int] = Field(None, ge=16, le=1024)
    difficulty: Optional[str] = None


class ProblemResponse(ProblemBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProblemDetailResponse(ProblemResponse):
    test_case_count: int = 0


# Test Case schemas
class TestCaseBase(BaseModel):
    input: str
    expected_output: str
    is_sample: bool = False
    is_hidden: bool = True
    points: int = 0


class TestCaseCreate(TestCaseBase):
    pass


class TestCaseUpdate(BaseModel):
    input: Optional[str] = None
    expected_output: Optional[str] = None
    is_sample: Optional[bool] = None
    is_hidden: Optional[bool] = None
    points: Optional[int] = None


class TestCaseResponse(TestCaseBase):
    id: UUID
    problem_id: UUID
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class TestCaseBrief(BaseModel):
    """Test case without expected output (for students)."""
    id: UUID
    input: str
    is_sample: bool
    points: int
    order: int


# Submission schemas
class SubmissionBase(BaseModel):
    code: str = Field(..., min_length=1)
    language: str


class SubmissionCreate(SubmissionBase):
    problem_id: UUID


class SubmissionResponse(BaseModel):
    id: UUID
    problem_id: UUID
    user_id: UUID
    language: str
    status: SubmissionStatus
    score: int
    total_points: int
    execution_time: Optional[int] = None
    memory_used: Optional[int] = None
    submitted_at: datetime
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubmissionDetailResponse(SubmissionResponse):
    results: list["TestResultResponse"] = []


class SubmissionListResponse(BaseModel):
    submissions: list[SubmissionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Test Result schemas
class TestResultResponse(BaseModel):
    id: UUID
    test_case_id: UUID
    status: str
    actual_output: Optional[str] = None
    execution_time: Optional[int] = None
    memory_used: Optional[int] = None
    points_earned: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
