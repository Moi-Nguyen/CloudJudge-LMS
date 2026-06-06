from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import User, Course, Enrollment, Submission, QuizAttempt
from ..models.user import UserRole
from ..schemas.stats import (
    StatsOverview,
    UserStats,
    CourseStats,
    SubmissionStats,
    LeaderboardEntry,
)
from ..repositories import UserRepository, CourseRepository, SubmissionRepository


class StatsService:
    """Service for statistics and analytics."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.course_repo = CourseRepository(db)
        self.submission_repo = SubmissionRepository(db)

    async def get_overview(self) -> StatsOverview:
        """Get system overview statistics."""
        # Count users
        total_users = await self.user_repo.count()

        # Count courses
        result = await self.db.execute(
            select(func.count()).select_from(Course).where(Course.is_deleted == False)
        )
        total_courses = result.scalar_one()

        # Count enrollments
        result = await self.db.execute(select(func.count()).select_from(Enrollment))
        total_enrollments = result.scalar_one()

        # Count submissions
        result = await self.db.execute(select(func.count()).select_from(Submission))
        total_submissions = result.scalar_one()

        # Count quizzes
        from ..models import Quiz
        result = await self.db.execute(select(func.count()).select_from(Quiz))
        total_quizzes = result.scalar_one()

        # Active users today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.count(func.distinct(Submission.user_id)))
            .select_from(Submission)
            .where(Submission.submitted_at >= today_start)
        )
        active_users_today = result.scalar_one() or 0

        # New users this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.count()).select_from(User).where(User.created_at >= month_start)
        )
        new_users_month = result.scalar_one()

        return StatsOverview(
            total_users=total_users,
            total_courses=total_courses,
            total_enrollments=total_enrollments,
            total_submissions=total_submissions,
            total_quizzes=total_quizzes,
            active_users_today=active_users_today,
            new_users_this_month=new_users_month,
        )

    async def get_user_stats(self) -> UserStats:
        """Get user statistics."""
        total = await self.user_repo.count()

        # Count by role
        result = await self.db.execute(
            select(User.role, func.count())
            .group_by(User.role)
        )
        by_role = {role.value: count for role, count in result.all()}

        # Active users
        result = await self.db.execute(
            select(func.count()).select_from(User).where(User.is_active == True)
        )
        active = result.scalar_one()

        # Inactive users
        inactive = total - active

        # New this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.count()).select_from(User).where(User.created_at >= month_start)
        )
        new_month = result.scalar_one()

        return UserStats(
            total=total,
            by_role=by_role,
            active=active,
            inactive=inactive,
            new_this_month=new_month,
        )

    async def get_course_stats(self) -> CourseStats:
        """Get course statistics."""
        result = await self.db.execute(
            select(func.count()).select_from(Course).where(Course.is_deleted == False)
        )
        total = result.scalar_one()

        result = await self.db.execute(
            select(func.count()).select_from(Course)
            .where(and_(Course.is_published == True, Course.is_deleted == False))
        )
        published = result.scalar_one()

        unpublished = total - published

        # Enrollments
        result = await self.db.execute(select(func.count()).select_from(Enrollment))
        total_enrollments = result.scalar_one()

        avg_enrollments = total_enrollments / total if total > 0 else 0

        return CourseStats(
            total=total,
            published=published,
            unpublished=unpublished,
            by_instructor={},  # Simplified
            total_enrollments=total_enrollments,
            average_enrollments_per_course=round(avg_enrollments, 2),
        )

    async def get_submission_stats(self) -> SubmissionStats:
        """Get submission statistics."""
        result = await self.db.execute(select(func.count()).select_from(Submission))
        total = result.scalar_one()

        # Count by status
        result = await self.db.execute(
            select(Submission.status, func.count())
            .group_by(Submission.status)
        )
        by_status = {status.value: count for status, count in result.all()}

        # Count by language
        result = await self.db.execute(
            select(Submission.language, func.count())
            .group_by(Submission.language)
        )
        by_language = {lang: count for lang, count in result.all()}

        # Average execution time
        result = await self.db.execute(
            select(func.avg(Submission.execution_time)).select_from(Submission)
        )
        avg_time = result.scalar_one() or 0

        # Acceptance rate
        accepted = by_status.get("accepted", 0)
        acceptance_rate = (accepted / total * 100) if total > 0 else 0

        # Submissions today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        result = await self.db.execute(
            select(func.count()).select_from(Submission)
            .where(Submission.submitted_at >= today_start)
        )
        today = result.scalar_one()

        # Submissions this week
        week_start = today_start - timedelta(days=today_start.weekday())
        result = await self.db.execute(
            select(func.count()).select_from(Submission)
            .where(Submission.submitted_at >= week_start)
        )
        week = result.scalar_one()

        return SubmissionStats(
            total=total,
            by_status=by_status,
            by_language=by_language,
            average_execution_time=round(avg_time, 2),
            acceptance_rate=round(acceptance_rate, 2),
            submissions_today=today,
            submissions_this_week=week,
        )

    async def get_leaderboard(self, limit: int = 10) -> list[LeaderboardEntry]:
        """Get submission leaderboard."""
        # Get top users by total score
        result = await self.db.execute(
            select(
                Submission.user_id,
                User.full_name,
                func.sum(Submission.score).label("total_score"),
            )
            .join(User, Submission.user_id == User.id)
            .group_by(Submission.user_id, User.full_name)
            .order_by(func.sum(Submission.score).desc())
            .limit(limit)
        )

        entries = []
        for rank, row in enumerate(result.all(), 1):
            entries.append(LeaderboardEntry(
                user_id=str(row.user_id),
                user_name=row.full_name,
                total_score=int(row.total_score or 0),
                rank=rank,
            ))

        return entries

    async def get_all_stats(self) -> dict:
        """Get all statistics."""
        return {
            "overview": await self.get_overview(),
            "user_stats": await self.get_user_stats(),
            "course_stats": await self.get_course_stats(),
            "submission_stats": await self.get_submission_stats(),
            "leaderboard": await self.get_leaderboard(),
        }
