from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.dependencies import get_current_user, get_current_instructor
from ....models import User, UserRole
from ....schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    CourseDetailResponse,
    CourseListResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentWithCourse,
    EnrollmentListResponse,
)
from ....schemas.common import MessageResponse
from ....services import CourseService
from ....errors import CourseNotFoundError, AlreadyEnrolledError, NotEnrolledError, NotCourseOwnerError


router = APIRouter(prefix="/courses", tags=["Courses"])


def _paginated_response(items: list, total: int, page: int, page_size: int):
    """Create paginated response."""
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    return {
        "courses": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all published courses."""
    course_service = CourseService(db)
    courses, total = await course_service.get_published(
        page=page,
        page_size=page_size,
        search=search,
    )
    return _paginated_response(
        [CourseResponse.model_validate(c) for c in courses],
        total,
        page,
        page_size,
    )


@router.get("/my", response_model=EnrollmentListResponse)
async def get_my_courses(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's enrolled courses."""
    course_service = CourseService(db)
    enrollments, total = await course_service.get_user_enrollments(
        user_id=current_user.id,
        status=status_filter,
        page=page,
        page_size=page_size,
    )
    return {
        "enrollments": [
            EnrollmentWithCourse.model_validate(e)
            for e in enrollments
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get("/my/created", response_model=CourseListResponse)
async def get_my_created_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Get courses created by current user (instructor/admin)."""
    course_service = CourseService(db)
    courses, total = await course_service.get_by_instructor(
        instructor_id=current_user.id,
        page=page,
        page_size=page_size,
    )
    return _paginated_response(
        [CourseResponse.model_validate(c) for c in courses],
        total,
        page,
        page_size,
    )


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Create a new course (instructor/admin only)."""
    course_service = CourseService(db)
    course = await course_service.create(current_user.id, data)
    return CourseResponse.model_validate(course)


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get course details."""
    course_service = CourseService(db)
    try:
        course = await course_service.get_by_id(course_id)
        return CourseDetailResponse.model_validate(course)
    except CourseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: UUID,
    data: CourseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Update a course (owner only)."""
    course_service = CourseService(db)
    try:
        course = await course_service.update(course_id, current_user.id, data, is_admin=current_user.role == UserRole.ADMIN)
        return CourseResponse.model_validate(course)
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


@router.delete("/{course_id}", response_model=MessageResponse)
async def delete_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Delete a course (owner only)."""
    course_service = CourseService(db)
    try:
        await course_service.delete(course_id, current_user.id, is_admin=current_user.role == UserRole.ADMIN)
        return MessageResponse(message="Course deleted successfully")
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


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enroll in a course."""
    course_service = CourseService(db)
    try:
        enrollment = await course_service.enroll(current_user.id, course_id)
        return EnrollmentResponse.model_validate(enrollment)
    except AlreadyEnrolledError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except CourseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{course_id}/enroll", response_model=MessageResponse)
@router.post("/{course_id}/unenroll", response_model=MessageResponse)
async def unenroll_from_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unenroll from a course."""
    course_service = CourseService(db)
    try:
        await course_service.unenroll(current_user.id, course_id)
        return MessageResponse(message="Unenrolled successfully")
    except NotEnrolledError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{course_id}/progress", response_model=EnrollmentResponse)
async def get_course_progress(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's progress in a course."""
    course_service = CourseService(db)
    enrollment = await course_service.get_enrollment(current_user.id, course_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this course",
        )
    return EnrollmentResponse.model_validate(enrollment)
