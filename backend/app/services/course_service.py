from typing import Optional
from uuid import UUID
import json
import math

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Course, Enrollment, Notification
from ..schemas.course import CourseCreate, CourseUpdate
from ..repositories import CourseRepository, EnrollmentRepository, UserRepository
from ..errors import (
    CourseNotFoundError,
    NotCourseOwnerError,
    AlreadyEnrolledError,
    NotEnrolledError,
)


class CourseService:
    """Service for course management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)
        self.user_repo = UserRepository(db)

    async def create(self, instructor_id: UUID, data: CourseCreate) -> Course:
        """Create a new course."""
        # Verify instructor exists
        instructor = await self.user_repo.get_by_id(instructor_id)
        if not instructor:
            raise CourseNotFoundError("Instructor not found")

        course = Course(
            title=data.title,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            instructor_id=str(instructor_id),
        )
        return await self.course_repo.create(course)

    async def get_by_id(self, course_id: UUID) -> Course:
        """Get course by ID."""
        course = await self.course_repo.get_with_details(course_id)
        if not course:
            raise CourseNotFoundError()
        return course

    async def get_published(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
    ) -> tuple[list[Course], int]:
        """Get published courses with pagination."""
        if search:
            courses = await self.course_repo.search(search, skip=(page-1)*page_size, limit=page_size)
            total = len(courses)  # Simplified for search
        else:
            courses = await self.course_repo.get_published(skip=(page-1)*page_size, limit=page_size)
            total = await self.course_repo.count_published()
        return courses, total

    async def get_by_instructor(
        self,
        instructor_id: UUID,
        page: int = 1,
        page_size: int = 20,
        include_unpublished: bool = True,
    ) -> tuple[list[Course], int]:
        """Get courses by instructor."""
        courses = await self.course_repo.get_by_instructor(
            instructor_id,
            skip=(page-1)*page_size,
            limit=page_size,
            include_unpublished=include_unpublished,
        )
        total = len(courses)  # Simplified
        return courses, total

    async def update(
        self,
        course_id: UUID,
        user_id: UUID,
        data: CourseUpdate,
        is_admin: bool = False,
    ) -> Course:
        """Update a course."""
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise CourseNotFoundError()

        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(course, field, value)

        return await self.course_repo.update(course)

    async def delete(self, course_id: UUID, user_id: UUID, is_admin: bool = False) -> None:
        """Delete a course."""
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise CourseNotFoundError()

        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        active_enrollments = [
            enrollment for enrollment in (course.enrollments or [])
            if enrollment.status == "active"
        ]
        for enrollment in active_enrollments:
            self.db.add(Notification(
                user_id=str(enrollment.user_id),
                title="Khóa học đã bị xóa",
                message=f'Khóa học "{course.title}" đã bị xóa bởi giảng viên/quản trị viên.',
                notification_type="course_deleted",
                metadata_json=json.dumps(
                    {"course_id": str(course.id), "course_title": course.title},
                    ensure_ascii=False,
                ),
            ))

        await self.course_repo.delete(course)

    async def enroll(self, user_id: UUID, course_id: UUID) -> Enrollment:
        """Enroll user in course."""
        # Check if already enrolled
        existing = await self.enrollment_repo.get_by_user_and_course(user_id, course_id)
        if existing:
            raise AlreadyEnrolledError()

        course = await self.course_repo.get_by_id(course_id)
        if not course or course.is_deleted:
            raise CourseNotFoundError()
        if not course.is_published:
            raise NotEnrolledError("Course is not available for enrollment")

        enrollment = Enrollment(
            user_id=str(user_id),
            course_id=str(course_id),
            status="active",
        )
        return await self.enrollment_repo.create(enrollment)

    async def unenroll(self, user_id: UUID, course_id: UUID) -> None:
        """Unenroll user from course."""
        enrollment = await self.enrollment_repo.get_by_user_and_course(user_id, course_id)
        if not enrollment:
            raise NotEnrolledError()

        await self.enrollment_repo.delete(enrollment)

    async def get_enrollment(
        self,
        user_id: UUID,
        course_id: UUID,
    ) -> Optional[Enrollment]:
        """Get enrollment for user in course."""
        return await self.enrollment_repo.get_by_user_and_course(user_id, course_id)

    async def get_user_enrollments(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Enrollment], int]:
        """Get all enrollments for a user."""
        enrollments = await self.enrollment_repo.get_user_enrollments(
            user_id,
            status=status,
            skip=(page-1)*page_size,
            limit=page_size,
        )
        total = len(enrollments)  # Simplified
        return enrollments, total

    async def update_progress(
        self,
        user_id: UUID,
        course_id: UUID,
        progress: int,
    ) -> Enrollment:
        """Update user progress in a course."""
        enrollment = await self.enrollment_repo.get_by_user_and_course(user_id, course_id)
        if not enrollment:
            raise NotEnrolledError()

        enrollment.progress = min(100, max(0, progress))
        if enrollment.progress == 100:
            from datetime import datetime
            enrollment.status = "completed"
            enrollment.completed_at = datetime.utcnow()

        return await self.enrollment_repo.update(enrollment)

    async def get_course_stats(self, course_id: UUID) -> dict:
        """Get statistics for a course."""
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise CourseNotFoundError()

        lesson_count = len(course.lessons) if course.lessons else 0
        student_count = await self.enrollment_repo.count_by_course(course_id)

        return {
            "total_lessons": lesson_count,
            "total_students": student_count,
            "is_published": course.is_published,
        }
