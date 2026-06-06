from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Lesson, Document, LessonType
from ..schemas.lesson import LessonCreate, LessonUpdate, DocumentCreate
from ..repositories import LessonRepository, DocumentRepository, CourseRepository
from ...errors import (
    LessonNotFoundError,
    CourseNotFoundError,
    NotCourseOwnerError,
)


class LessonService:
    """Service for lesson management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.lesson_repo = LessonRepository(db)
        self.document_repo = DocumentRepository(db)
        self.course_repo = CourseRepository(db)

    async def create(self, instructor_id: UUID, data: LessonCreate) -> Lesson:
        """Create a new lesson."""
        # Verify course exists and user owns it
        course = await self.course_repo.get_by_id(data.course_id)
        if not course:
            raise CourseNotFoundError()

        if course.instructor_id != instructor_id:
            raise NotCourseOwnerError()

        # Get next order
        order = await self.lesson_repo.get_next_order(data.course_id)

        lesson = Lesson(
            course_id=data.course_id,
            title=data.title,
            description=data.description,
            content=data.content,
            lesson_type=data.lesson_type,
            order=data.order or order,
            duration_minutes=data.duration_minutes,
        )
        return await self.lesson_repo.create(lesson)

    async def get_by_id(self, lesson_id: UUID) -> Lesson:
        """Get lesson by ID."""
        lesson = await self.lesson_repo.get_with_details(lesson_id)
        if not lesson:
            raise LessonNotFoundError()
        return lesson

    async def get_by_course(
        self,
        course_id: UUID,
        page: int = 1,
        page_size: int = 100,
    ) -> tuple[list[Lesson], int]:
        """Get all lessons for a course."""
        lessons = await self.lesson_repo.get_by_course(
            course_id,
            skip=(page-1)*page_size,
            limit=page_size,
        )
        total = await self.lesson_repo.count_by_course(course_id)
        return lessons, total

    async def update(
        self,
        lesson_id: UUID,
        user_id: UUID,
        data: LessonUpdate,
    ) -> Lesson:
        """Update a lesson."""
        lesson = await self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise LessonNotFoundError()

        course = await self.course_repo.get_by_id(lesson.course_id)
        if course.instructor_id != user_id:
            raise NotCourseOwnerError()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lesson, field, value)

        return await self.lesson_repo.update(lesson)

    async def delete(self, lesson_id: UUID, user_id: UUID) -> None:
        """Delete a lesson."""
        lesson = await self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise LessonNotFoundError()

        course = await self.course_repo.get_by_id(lesson.course_id)
        if course.instructor_id != user_id:
            raise NotCourseOwnerError()

        await self.lesson_repo.delete(lesson)

    async def reorder(self, lesson_id: UUID, new_order: int, user_id: UUID) -> Lesson:
        """Reorder a lesson."""
        lesson = await self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise LessonNotFoundError()

        course = await self.course_repo.get_by_id(lesson.course_id)
        if course.instructor_id != user_id:
            raise NotCourseOwnerError()

        lesson.order = new_order
        return await self.lesson_repo.update(lesson)


class DocumentService:
    """Service for document management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.document_repo = DocumentRepository(db)
        self.lesson_repo = LessonRepository(db)

    async def create(self, data: DocumentCreate) -> Document:
        """Create a new document."""
        # Verify lesson exists
        lesson = await self.lesson_repo.get_by_id(data.lesson_id)
        if not lesson:
            raise LessonNotFoundError()

        document = Document(
            lesson_id=data.lesson_id,
            title=data.title,
            file_url=data.file_url,
            file_type=data.file_type,
            file_size=data.file_size,
        )
        return await self.document_repo.create(document)

    async def get_by_id(self, document_id: UUID) -> Document:
        """Get document by ID."""
        document = await self.document_repo.get_by_id(document_id)
        if not document:
            raise LessonNotFoundError("Document not found")
        return document

    async def get_by_lesson(
        self,
        lesson_id: UUID,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Document], int]:
        """Get all documents for a lesson."""
        documents = await self.document_repo.get_by_lesson(
            lesson_id,
            skip=(page-1)*page_size,
            limit=page_size,
        )
        total = len(documents)  # Simplified
        return documents, total

    async def delete(self, document_id: UUID) -> None:
        """Delete a document."""
        document = await self.document_repo.get_by_id(document_id)
        if not document:
            raise LessonNotFoundError("Document not found")

        await self.document_repo.delete(document)
