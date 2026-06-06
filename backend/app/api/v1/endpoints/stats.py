from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.dependencies import get_current_admin
from ....models import User
from ....services import StatsService


router = APIRouter(prefix="/stats", tags=["Statistics"])


@router.get("/overview")
async def get_stats_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Get system statistics overview (admin only)."""
    stats_service = StatsService(db)
    return await stats_service.get_overview()


@router.get("/users")
async def get_user_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Get user statistics (admin only)."""
    stats_service = StatsService(db)
    return await stats_service.get_user_stats()


@router.get("/courses")
async def get_course_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Get course statistics (admin only)."""
    stats_service = StatsService(db)
    return await stats_service.get_course_stats()


@router.get("/submissions")
async def get_submission_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Get submission statistics (admin only)."""
    stats_service = StatsService(db)
    return await stats_service.get_submission_stats()


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Get submission leaderboard (admin only)."""
    stats_service = StatsService(db)
    return await stats_service.get_leaderboard(limit=limit)


@router.get("/all")
async def get_all_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Get all statistics (admin only)."""
    stats_service = StatsService(db)
    return await stats_service.get_all_stats()
