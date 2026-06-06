from pydantic import BaseModel
from typing import Any


class StatsOverview(BaseModel):
    total_users: int
    total_courses: int
    total_enrollments: int
    total_submissions: int
    total_quizzes: int
    active_users_today: int
    new_users_this_month: int


class UserStats(BaseModel):
    total: int
    by_role: dict[str, int]
    active: int
    inactive: int
    new_this_month: int


class CourseStats(BaseModel):
    total: int
    published: int
    unpublished: int
    by_instructor: dict[str, int]
    total_enrollments: int
    average_enrollments_per_course: float


class SubmissionStats(BaseModel):
    total: int
    by_status: dict[str, int]
    by_language: dict[str, int]
    average_execution_time: float
    acceptance_rate: float
    submissions_today: int
    submissions_this_week: int


class LeaderboardEntry(BaseModel):
    user_id: str
    user_name: str
    total_score: int
    rank: int


class StatsResponse(BaseModel):
    overview: StatsOverview
    user_stats: UserStats
    course_stats: CourseStats
    submission_stats: SubmissionStats
    leaderboard: list[LeaderboardEntry]
