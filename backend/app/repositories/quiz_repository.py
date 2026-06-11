from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from .base_repository import BaseRepository


class QuizRepository(BaseRepository[Quiz]):
    """Repository for Quiz model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Quiz, db)

    async def get_with_questions(self, quiz_id: UUID) -> Optional[Quiz]:
        """Get quiz with all questions loaded."""
        result = await self.db.execute(
            select(Quiz)
            .where(Quiz.id == str(quiz_id))
            .options(
                selectinload(Quiz.questions).selectinload(QuizQuestion.answers),
                selectinload(Quiz.lesson),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_lesson(self, lesson_id: UUID) -> Optional[Quiz]:
        """Get quiz by lesson ID."""
        result = await self.db.execute(
            select(Quiz).where(Quiz.lesson_id == str(lesson_id))
        )
        return result.scalar_one_or_none()


class QuizQuestionRepository(BaseRepository[QuizQuestion]):
    """Repository for QuizQuestion model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(QuizQuestion, db)

    async def get_by_quiz(
        self,
        quiz_id: UUID,
        shuffle: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> list[QuizQuestion]:
        """Get all questions for a quiz."""
        query = select(QuizQuestion).where(QuizQuestion.quiz_id == str(quiz_id))

        if shuffle:
            query = query.order_by(func.random())
        else:
            query = query.order_by(QuizQuestion.order, QuizQuestion.created_at)

        result = await self.db.execute(
            query.offset(skip).limit(limit)
        )
        return list(result.scalars().all())


class QuizAttemptRepository(BaseRepository[QuizAttempt]):
    """Repository for QuizAttempt model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(QuizAttempt, db)

    async def get_user_attempt_for_quiz(
        self,
        quiz_id: UUID,
        user_id: UUID
    ) -> list[QuizAttempt]:
        """Get all attempts by user for a specific quiz."""
        result = await self.db.execute(
            select(QuizAttempt)
            .where(
                and_(
                    QuizAttempt.quiz_id == str(quiz_id),
                    QuizAttempt.user_id == str(user_id),
                )
            )
            .options(selectinload(QuizAttempt.answers))
            .order_by(QuizAttempt.started_at.desc())
        )
        return list(result.scalars().all())

    async def count_user_attempts(self, quiz_id: UUID, user_id: UUID) -> int:
        """Count attempts by user for a quiz."""
        result = await self.db.execute(
            select(func.count())
            .select_from(QuizAttempt)
            .where(
                and_(
                    QuizAttempt.quiz_id == str(quiz_id),
                    QuizAttempt.user_id == str(user_id),
                )
            )
        )
        return result.scalar_one()

    async def get_best_attempt(
        self,
        quiz_id: UUID,
        user_id: UUID
    ) -> Optional[QuizAttempt]:
        """Get the best attempt by user for a quiz."""
        result = await self.db.execute(
            select(QuizAttempt)
            .where(
                and_(
                    QuizAttempt.quiz_id == str(quiz_id),
                    QuizAttempt.user_id == str(user_id),
                    QuizAttempt.submitted_at.isnot(None),
                )
            )
            .order_by(QuizAttempt.percentage.desc(), QuizAttempt.time_taken_seconds)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_recent_attempts(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> list[QuizAttempt]:
        """Get recent quiz attempts for a user."""
        result = await self.db.execute(
            select(QuizAttempt)
            .where(QuizAttempt.user_id == str(user_id))
            .options(
                selectinload(QuizAttempt.quiz).selectinload("lesson"),
                selectinload(QuizAttempt.answers),
            )
            .order_by(QuizAttempt.started_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


class QuizAnswerRepository(BaseRepository[QuizAnswer]):
    """Repository for QuizAnswer model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(QuizAnswer, db)

    async def create_bulk(
        self,
        answers: list[QuizAnswer]
    ) -> list[QuizAnswer]:
        """Create multiple answers at once."""
        self.db.add_all(answers)
        await self.db.flush()
        for answer in answers:
            await self.db.refresh(answer)
        return answers
