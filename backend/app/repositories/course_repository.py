from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Course, Enrollment, User, UserRole
from .base_repository import BaseRepository


class CourseRepository(BaseRepository[Course]):
    """Repository for Course model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Course, db)

    async def get_published(self, skip: int = 0, limit: int = 20) -> list[Course]:
        """Get all published courses."""
        result = await self.db.execute(
            select(Course)
            .where(Course.is_published == True)
            .where(Course.is_deleted == False)
            .options(selectinload(Course.instructor))
            .order_by(Course.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_instructor(
        self,
        instructor_id: UUID,
        skip: int = 0,
        limit: int = 20,
        include_unpublished: bool = True
    ) -> list[Course]:
        """Get courses by instructor."""
        query = select(Course).where(Course.instructor_id == instructor_id)

        if not include_unpublished:
            query = query.where(Course.is_published == True)

        result = await self.db.execute(
            query
            .options(selectinload(Course.instructor))
            .order_by(Course.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_with_details(self, course_id: UUID) -> Optional[Course]:
        """Get course with all relationships loaded."""
        result = await self.db.execute(
            select(Course)
            .where(Course.id == course_id)
            .options(
                selectinload(Course.instructor),
                selectinload(Course.lessons),
                selectinload(Course.enrollments),
            )
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20
    ) -> list[Course]:
        """Search courses by title or description."""
        search_pattern = f"%{query}%"
        result = await self.db.execute(
            select(Course)
            .where(
                and_(
                    Course.is_published == True,
                    Course.is_deleted == False,
                    or_(
                        Course.title.ilike(search_pattern),
                        Course.description.ilike(search_pattern),
                    )
                )
            )
            .options(selectinload(Course.instructor))
            .order_by(Course.title)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_published(self) -> int:
        """Count total published courses."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Course)
            .where(Course.is_published == True)
            .where(Course.is_deleted == False)
        )
        return result.scalar_one()


class EnrollmentRepository(BaseRepository[Enrollment]):
    """Repository for Enrollment model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Enrollment, db)

    async def get_by_user_and_course(
        self,
        user_id: UUID,
        course_id: UUID
    ) -> Optional[Enrollment]:
        """Get enrollment by user and course."""
        result = await self.db.execute(
            select(Enrollment)
            .where(
                and_(
                    Enrollment.user_id == user_id,
                    Enrollment.course_id == course_id,
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_user_enrollments(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> list[Enrollment]:
        """Get all enrollments for a user."""
        query = select(Enrollment).where(Enrollment.user_id == user_id)

        if status:
            query = query.where(Enrollment.status == status)

        result = await self.db.execute(
            query
            .options(selectinload(Enrollment.course).selectinload(Course.instructor))
            .order_by(Enrollment.enrolled_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_course_enrollments(
        self,
        course_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> list[Enrollment]:
        """Get all enrollments for a course."""
        result = await self.db.execute(
            select(Enrollment)
            .where(Enrollment.course_id == course_id)
            .options(selectinload(Enrollment.user))
            .order_by(Enrollment.enrolled_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def is_enrolled(self, user_id: UUID, course_id: UUID) -> bool:
        """Check if user is enrolled in course."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Enrollment)
            .where(
                and_(
                    Enrollment.user_id == user_id,
                    Enrollment.course_id == course_id,
                    Enrollment.status == "active",
                )
            )
        )
        return result.scalar_one() > 0

    async def count_by_course(self, course_id: UUID) -> int:
        """Count enrollments for a course."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Enrollment)
            .where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.status == "active",
                )
            )
        )
        return result.scalar_one()
