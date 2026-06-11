from typing import Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import ProgrammingProblem, TestCase, Submission, TestResult, SubmissionStatus
from ..models.lesson import Lesson
from .base_repository import BaseRepository


class ProblemRepository(BaseRepository[ProgrammingProblem]):
    """Repository for ProgrammingProblem model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(ProgrammingProblem, db)

    async def get_with_test_cases(self, problem_id: UUID) -> Optional[ProgrammingProblem]:
        """Get problem with all test cases loaded."""
        result = await self.db.execute(
            select(ProgrammingProblem)
            .where(ProgrammingProblem.id == str(problem_id))
            .options(selectinload(ProgrammingProblem.test_cases))
        )
        return result.scalar_one_or_none()

    async def get_by_lesson(self, lesson_id: UUID) -> Optional[ProgrammingProblem]:
        """Get problem by lesson ID."""
        result = await self.db.execute(
            select(ProgrammingProblem).where(ProgrammingProblem.lesson_id == str(lesson_id))
        )
        return result.scalar_one_or_none()

    async def get_by_course(
        self,
        course_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ProgrammingProblem]:
        """Get all programming problems for lessons in a course."""
        result = await self.db.execute(
            select(ProgrammingProblem)
            .join(Lesson, ProgrammingProblem.lesson_id == Lesson.id)
            .where(Lesson.course_id == str(course_id))
            .order_by(Lesson.order, ProgrammingProblem.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_course(self, course_id: UUID) -> int:
        """Count programming problems for lessons in a course."""
        result = await self.db.execute(
            select(func.count())
            .select_from(ProgrammingProblem)
            .join(Lesson, ProgrammingProblem.lesson_id == Lesson.id)
            .where(Lesson.course_id == str(course_id))
        )
        return result.scalar_one()

    async def get_by_difficulty(
        self,
        difficulty: str,
        skip: int = 0,
        limit: int = 20
    ) -> list[ProgrammingProblem]:
        """Get problems by difficulty."""
        result = await self.db.execute(
            select(ProgrammingProblem)
            .where(ProgrammingProblem.difficulty == difficulty)
            .order_by(ProgrammingProblem.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


class TestCaseRepository(BaseRepository[TestCase]):
    """Repository for TestCase model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(TestCase, db)

    async def get_by_problem(
        self,
        problem_id: UUID,
        include_hidden: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> list[TestCase]:
        """Get all test cases for a problem."""
        query = select(TestCase).where(TestCase.problem_id == str(problem_id))

        if not include_hidden:
            query = query.where(TestCase.is_hidden == False)

        result = await self.db.execute(
            query.order_by(TestCase.order, TestCase.created_at)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_sample_cases(self, problem_id: UUID) -> list[TestCase]:
        """Get sample test cases for display."""
        result = await self.db.execute(
            select(TestCase)
            .where(
                and_(
                    TestCase.problem_id == str(problem_id),
                    TestCase.is_sample == True,
                )
            )
            .order_by(TestCase.order)
        )
        return list(result.scalars().all())


class SubmissionRepository(BaseRepository[Submission]):
    """Repository for Submission model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(Submission, db)

    async def get_with_results(self, submission_id: UUID) -> Optional[Submission]:
        """Get submission with all test results."""
        result = await self.db.execute(
            select(Submission)
            .where(Submission.id == str(submission_id))
            .options(selectinload(Submission.results).selectinload("test_case"))
        )
        return result.scalar_one_or_none()

    async def get_user_submissions(
        self,
        user_id: UUID,
        problem_id: Optional[UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> list[Submission]:
        """Get submissions by user with filters."""
        query = select(Submission).where(Submission.user_id == str(user_id))

        if problem_id:
            query = query.where(Submission.problem_id == str(problem_id))
        if status:
            query = query.where(Submission.status == status)

        result = await self.db.execute(
            query
            .options(selectinload(Submission.results))
            .order_by(Submission.submitted_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_problem_submissions(
        self,
        problem_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> list[Submission]:
        """Get all submissions for a problem."""
        result = await self.db.execute(
            select(Submission)
            .where(Submission.problem_id == str(problem_id))
            .options(selectinload(Submission.user))
            .order_by(Submission.submitted_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_status(self, status: SubmissionStatus) -> int:
        """Count submissions by status."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Submission)
            .where(Submission.status == status)
        )
        return result.scalar_one()

    async def count_by_problem(self, problem_id: UUID) -> int:
        """Count submissions for a problem."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Submission)
            .where(Submission.problem_id == str(problem_id))
        )
        return result.scalar_one()

    async def get_recent(
        self,
        limit: int = 50
    ) -> list[Submission]:
        """Get recent submissions."""
        result = await self.db.execute(
            select(Submission)
            .options(selectinload(Submission.user), selectinload(Submission.problem))
            .order_by(Submission.submitted_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())


class TestResultRepository(BaseRepository[TestResult]):
    """Repository for TestResult model operations."""

    def __init__(self, db: AsyncSession):
        super().__init__(TestResult, db)

    async def get_by_submission(
        self,
        submission_id: UUID
    ) -> list[TestResult]:
        """Get all test results for a submission."""
        result = await self.db.execute(
            select(TestResult)
            .where(TestResult.submission_id == str(submission_id))
            .options(selectinload(TestResult.test_case))
            .order_by(TestResult.test_case.order)
        )
        return list(result.scalars().all())
