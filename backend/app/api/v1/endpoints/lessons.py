from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.dependencies import get_current_user, get_current_instructor
from ....models import User, UserRole
from ....schemas.lesson import (
    LessonCreate,
    LessonUpdate,
    LessonResponse,
    LessonDetailResponse,
    LessonListResponse,
    DocumentResponse,
)
from ....schemas.common import MessageResponse
from ....services import LessonService
from ....errors import LessonNotFoundError, CourseNotFoundError, NotCourseOwnerError


router = APIRouter(prefix="/lessons", tags=["Lessons"])


def _paginated_response(items: list, total: int, page: int, page_size: int):
    """Create paginated response."""
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {
        "lessons": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/course/{course_id}", response_model=LessonListResponse)
async def get_course_lessons(
    course_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all lessons for a course."""
    lesson_service = LessonService(db)
    course = await lesson_service.course_repo.get_by_id(course_id)
    can_manage = (
        current_user.role == UserRole.ADMIN
        or (course is not None and str(course.instructor_id) == str(current_user.id))
    )
    lessons, total = await lesson_service.get_by_course(
        course_id,
        page=page,
        page_size=page_size,
        published_only=not can_manage,
    )
    return _paginated_response(
        [LessonResponse.model_validate(l) for l in lessons],
        total,
        page,
        page_size,
    )


@router.post("", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    data: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Create a new lesson (instructor/admin only)."""
    lesson_service = LessonService(db)
    try:
        lesson = await lesson_service.create(current_user.id, data, is_admin=current_user.role == UserRole.ADMIN)
        return LessonResponse.model_validate(lesson)
    except CourseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.get("/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get lesson details."""
    lesson_service = LessonService(db)
    try:
        lesson = await lesson_service.get_by_id(lesson_id)
        return LessonDetailResponse.model_validate(lesson)
    except LessonNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: UUID,
    data: LessonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Update a lesson (owner only)."""
    lesson_service = LessonService(db)
    try:
        lesson = await lesson_service.update(lesson_id, current_user.id, data, is_admin=current_user.role == UserRole.ADMIN)
        return LessonResponse.model_validate(lesson)
    except LessonNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/{lesson_id}", response_model=MessageResponse)
async def delete_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Delete a lesson (owner only)."""
    lesson_service = LessonService(db)
    try:
        await lesson_service.delete(lesson_id, current_user.id, is_admin=current_user.role == UserRole.ADMIN)
        return MessageResponse(message="Lesson deleted successfully")
    except LessonNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.put("/{lesson_id}/reorder", response_model=LessonResponse)
async def reorder_lesson(
    lesson_id: UUID,
    new_order: int = Query(..., ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Reorder a lesson."""
    lesson_service = LessonService(db)
    try:
        lesson = await lesson_service.reorder(lesson_id, new_order, current_user.id, is_admin=current_user.role == UserRole.ADMIN)
        return LessonResponse.model_validate(lesson)
    except LessonNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
