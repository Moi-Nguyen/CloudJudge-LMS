from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel


class DashboardUser(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime


class DashboardCourse(BaseModel):
    id: UUID
    title: str
    is_published: bool
    created_at: datetime
    progress: Optional[int] = None
    student_count: Optional[int] = None


class DashboardSubmission(BaseModel):
    id: UUID
    problem_id: UUID
    user_id: UUID
    problem_title: str
    user_name: str
    status: str
    score: int
    total_points: int
    submitted_at: datetime


class AdminDashboardStats(BaseModel):
    total_users: int
    total_courses: int
    total_enrollments: int
    total_lessons: int
    total_problems: int
    total_submissions: int


class InstructorDashboardStats(BaseModel):
    created_courses: int
    total_students: int
    total_lessons: int
    total_problems: int
    total_submissions: int


class StudentDashboardStats(BaseModel):
    enrolled_courses: int
    completed_courses: int
    average_progress: float
    total_submissions: int
    accepted_submissions: int


class AdminDashboardResponse(BaseModel):
    role: Literal["admin"]
    stats: AdminDashboardStats
    recent_users: list[DashboardUser]
    recent_courses: list[DashboardCourse]
    recent_submissions: list[DashboardSubmission]


class InstructorDashboardResponse(BaseModel):
    role: Literal["instructor"]
    stats: InstructorDashboardStats
    courses: list[DashboardCourse]
    recent_submissions: list[DashboardSubmission]


class StudentDashboardResponse(BaseModel):
    role: Literal["student"]
    stats: StudentDashboardStats
    my_courses: list[DashboardCourse]
    recent_submissions: list[DashboardSubmission]


DashboardResponse = AdminDashboardResponse | InstructorDashboardResponse | StudentDashboardResponse
