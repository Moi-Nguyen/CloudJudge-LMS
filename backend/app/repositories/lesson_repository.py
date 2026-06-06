from typing import Optional
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Lesson, Document, LessonType
from .base_repository import BaseRepository


class LessonRepository(BaseRepository[Lesson]):
    """Repository for Lesson model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Lesson, db)

    async def get_by_course(
        self,
        course_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> list[Lesson]:
        """Get all lessons for a course."""
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.course_id == course_id)
            .options(
                selectinload(Lesson.quiz),
                selectinload(Lesson.problem),
                selectinload(Lesson.documents),
            )
            .order_by(Lesson.order, Lesson.created_at)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_with_details(self, lesson_id: UUID) -> Optional[Lesson]:
        """Get lesson with all details loaded."""
        result = await self.db.execute(
            select(Lesson)
            .where(Lesson.id == lesson_id)
            .options(
                selectinload(Lesson.quiz).selectinload("questions"),
                selectinload(Lesson.problem),
                selectinload(Lesson.documents),
                selectinload(Lesson.course),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_type(
        self,
        course_id: UUID,
        lesson_type: LessonType,
        skip: int = 0,
        limit: int = 50
    ) -> list[Lesson]:
        """Get lessons by type."""
        result = await self.db.execute(
            select(Lesson)
            .where(
                and_(
                    Lesson.course_id == course_id,
                    Lesson.lesson_type == lesson_type,
                )
            )
            .order_by(Lesson.order, Lesson.created_at)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_course(self, course_id: UUID) -> int:
        """Count lessons for a course."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Lesson)
            .where(Lesson.course_id == course_id)
        )
        return result.scalar_one()

    async def get_next_order(self, course_id: UUID) -> int:
        """Get the next lesson order number."""
        result = await self.db.execute(
            select(func.max(Lesson.order))
            .select_from(Lesson)
            .where(Lesson.course_id == course_id)
        )
        max_order = result.scalar_one()
        return (max_order or 0) + 1


class DocumentRepository(BaseRepository[Document]):
    """Repository for Document model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Document, db)

    async def get_by_lesson(
        self,
        lesson_id: UUID,
        skip: int = 0,
        limit: int = 50
    ) -> list[Document]:
        """Get all documents for a lesson."""
        result = await self.db.execute(
            select(Document)
            .where(Document.lesson_id == lesson_id)
            .order_by(Document.created_at)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
