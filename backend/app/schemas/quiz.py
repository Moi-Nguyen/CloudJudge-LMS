from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class QuizBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    time_limit: Optional[int] = Field(None, ge=1)  # minutes
    max_attempts: int = Field(default=1, ge=1)
    passing_score: int = Field(default=60, ge=0, le=100)
    shuffle_questions: bool = False
    show_correct_answers: bool = True


class QuizCreate(QuizBase):
    lesson_id: UUID


class QuizUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    time_limit: Optional[int] = Field(None, ge=1)
    max_attempts: Optional[int] = Field(None, ge=1)
    passing_score: Optional[int] = Field(None, ge=0, le=100)
    shuffle_questions: Optional[bool] = None
    show_correct_answers: Optional[bool] = None


class QuizResponse(QuizBase):
    id: UUID
    lesson_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuizDetailResponse(QuizResponse):
    questions: list["QuizQuestionResponse"] = []


# Question schemas
class QuestionBase(BaseModel):
    question: str = Field(..., min_length=1)
    question_type: str = "multiple_choice"
    options: Optional[list[dict[str, Any]]] = None
    explanation: Optional[str] = None
    points: int = Field(default=1, ge=1)
    order: int = 0


class QuestionCreate(QuestionBase):
    correct_answer: str = Field(..., min_length=1)


class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    options: Optional[list[dict[str, Any]]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    points: Optional[int] = Field(None, ge=1)
    order: Optional[int] = None


class QuizQuestionResponse(QuestionBase):
    id: UUID
    quiz_id: UUID
    correct_answer: str

    class Config:
        from_attributes = True


class QuizQuestionBrief(BaseModel):
    """Question without correct answer (for taking quiz)."""
    id: UUID
    question: str
    question_type: str
    options: Optional[list[dict[str, Any]]] = None
    points: int
    order: int


class QuizForStudentResponse(BaseModel):
    """Quiz without correct answers for students."""
    id: UUID
    lesson_id: UUID
    title: str
    description: Optional[str]
    time_limit: Optional[int]
    max_attempts: int
    passing_score: int
    shuffle_questions: bool
    questions: list[QuizQuestionBrief]

    class Config:
        from_attributes = True


# Attempt schemas
class AttemptResponse(BaseModel):
    id: UUID
    quiz_id: UUID
    user_id: UUID
    score: int
    total_points: int
    percentage: int
    passed: bool
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None

    class Config:
        from_attributes = True


class AnswerSubmission(BaseModel):
    question_id: UUID
    selected_answer: str


class QuizSubmission(BaseModel):
    answers: list[AnswerSubmission]


class QuizResultResponse(BaseModel):
    attempt: AttemptResponse
    correct_answers: Optional[list[dict[str, Any]]] = None  # Only if show_correct_answers is True
    show_correct_answers: bool


class AttemptListResponse(BaseModel):
    attempts: list[AttemptResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
