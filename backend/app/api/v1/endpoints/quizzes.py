from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.dependencies import get_current_user, get_current_instructor
from ....models import User
from ....schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuizResponse,
    QuizDetailResponse,
    QuizForStudentResponse,
    QuestionCreate,
    QuestionUpdate,
    QuizQuestionResponse,
    QuizQuestionBrief,
    AttemptResponse,
    QuizSubmission,
    QuizResultResponse,
    AttemptListResponse,
)
from ....services import QuizService
from ....errors import QuizNotFoundError, QuestionNotFoundError, AttemptNotFoundError, MaxAttemptsReachedError, NotCourseOwnerError, QuizAlreadySubmittedError


router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.post("", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    data: QuizCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Create a new quiz (instructor/admin only)."""
    quiz_service = QuizService(db)
    try:
        quiz = await quiz_service.create(current_user.id, data)
        return QuizResponse.model_validate(quiz)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.get("/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Get quiz with questions (instructor/admin only sees correct answers)."""
    quiz_service = QuizService(db)
    try:
        quiz = await quiz_service.get_by_id(quiz_id)
        return QuizDetailResponse.model_validate(quiz)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{quiz_id}/student", response_model=QuizForStudentResponse)
async def get_quiz_for_student(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get quiz for student (without correct answers)."""
    quiz_service = QuizService(db)
    try:
        quiz = await quiz_service.get_for_student(quiz_id)
        # Convert to student response (without correct answers)
        return QuizForStudentResponse.model_validate(quiz)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: UUID,
    data: QuizUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Update a quiz (owner only)."""
    quiz_service = QuizService(db)
    try:
        quiz = await quiz_service.update(quiz_id, current_user.id, data)
        return QuizResponse.model_validate(quiz)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Delete a quiz (owner only)."""
    quiz_service = QuizService(db)
    try:
        await quiz_service.delete(quiz_id, current_user.id)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


# Question endpoints
@router.post("/{quiz_id}/questions", response_model=QuizQuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question(
    quiz_id: UUID,
    data: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Add a question to a quiz."""
    quiz_service = QuizService(db)
    try:
        question = await quiz_service.add_question(quiz_id, current_user.id, data)
        return QuizQuestionResponse.model_validate(question)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.put("/questions/{question_id}", response_model=QuizQuestionResponse)
async def update_question(
    question_id: UUID,
    data: QuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Update a question."""
    quiz_service = QuizService(db)
    try:
        question = await quiz_service.update_question(question_id, current_user.id, data)
        return QuizQuestionResponse.model_validate(question)
    except QuestionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Delete a question."""
    quiz_service = QuizService(db)
    try:
        await quiz_service.delete_question(question_id, current_user.id)
    except QuestionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


# Attempt endpoints
@router.post("/{quiz_id}/attempt", response_model=AttemptResponse, status_code=status.HTTP_201_CREATED)
async def start_attempt(
    quiz_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new quiz attempt."""
    quiz_service = QuizService(db)
    try:
        attempt = await quiz_service.start_attempt(current_user.id, quiz_id)
        return AttemptResponse.model_validate(attempt)
    except QuizNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except MaxAttemptsReachedError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    quiz_id: UUID,
    submission: QuizSubmission,
    attempt_id: UUID = Query(..., description="Attempt ID from start_attempt"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit quiz answers."""
    quiz_service = QuizService(db)
    try:
        attempt = await quiz_service.submit_attempt(attempt_id, current_user.id, submission)
        return QuizResultResponse(
            attempt=AttemptResponse.model_validate(attempt),
            show_correct_answers=True,  # Configure based on quiz settings
        )
    except AttemptNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except QuizAlreadySubmittedError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{quiz_id}/attempts", response_model=AttemptListResponse)
async def get_quiz_attempts(
    quiz_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's attempts for a quiz."""
    quiz_service = QuizService(db)
    attempts, total = await quiz_service.get_user_attempts(
        current_user.id,
        quiz_id=quiz_id,
        page=page,
        page_size=page_size,
    )
    return {
        "attempts": [AttemptResponse.model_validate(a) for a in attempts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get("/attempts/my", response_model=AttemptListResponse)
async def get_my_attempts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all quiz attempts for current user."""
    quiz_service = QuizService(db)
    attempts, total = await quiz_service.get_user_attempts(
        current_user.id,
        page=page,
        page_size=page_size,
    )
    return {
        "attempts": [AttemptResponse.model_validate(a) for a in attempts],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }
