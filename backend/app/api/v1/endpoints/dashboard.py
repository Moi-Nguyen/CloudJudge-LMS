from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.dependencies import get_current_user
from ....models import Course, Enrollment, Lesson, ProgrammingProblem, Submission, User
from ....models.problem import SubmissionStatus
from ....models.user import UserRole
from ....schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _count(db: AsyncSession, statement) -> int:
    return int((await db.execute(statement)).scalar() or 0)


def _submission_item(row) -> dict:
    submission, problem_title, user_name = row
    return {
        "id": submission.id,
        "problem_id": submission.problem_id,
        "user_id": submission.user_id,
        "problem_title": problem_title,
        "user_name": user_name,
        "status": submission.status,
        "score": submission.score,
        "total_points": submission.total_points,
        "submitted_at": submission.submitted_at,
    }


async def _recent_submissions(db: AsyncSession, limit: int = 5, course_owner_id: str | None = None, user_id: str | None = None) -> list[dict]:
    statement = (
        select(Submission, ProgrammingProblem.title, User.full_name)
        .join(ProgrammingProblem, Submission.problem_id == ProgrammingProblem.id)
        .join(User, Submission.user_id == User.id)
        .order_by(Submission.submitted_at.desc())
        .limit(limit)
    )

    if course_owner_id is not None:
        statement = statement.join(Lesson, ProgrammingProblem.lesson_id == Lesson.id).join(Course, Lesson.course_id == Course.id).where(Course.instructor_id == course_owner_id)
    if user_id is not None:
        statement = statement.where(Submission.user_id == user_id)

    rows = (await db.execute(statement)).all()
    return [_submission_item(row) for row in rows]


@router.get("/me", response_model=DashboardResponse)
async def get_my_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get role-aware dashboard data for the current user."""
    if current_user.role == UserRole.ADMIN:
        recent_users = (await db.execute(select(User).order_by(User.created_at.desc()).limit(5))).scalars().all()
        recent_courses = (await db.execute(select(Course).where(Course.is_deleted.is_(False)).order_by(Course.created_at.desc()).limit(5))).scalars().all()

        return {
            "role": "admin",
            "stats": {
                "total_users": await _count(db, select(func.count(User.id))),
                "total_courses": await _count(db, select(func.count(Course.id)).where(Course.is_deleted.is_(False))),
                "total_enrollments": await _count(db, select(func.count(Enrollment.id))),
                "total_lessons": await _count(db, select(func.count(Lesson.id))),
                "total_problems": await _count(db, select(func.count(ProgrammingProblem.id))),
                "total_submissions": await _count(db, select(func.count(Submission.id))),
            },
            "recent_users": recent_users,
            "recent_courses": recent_courses,
            "recent_submissions": await _recent_submissions(db),
        }

    if current_user.role == UserRole.INSTRUCTOR:
        instructor_id = str(current_user.id)
        course_rows = (
            await db.execute(
                select(Course, func.count(Enrollment.id).label("student_count"))
                .outerjoin(Enrollment, Course.id == Enrollment.course_id)
                .where(Course.instructor_id == instructor_id, Course.is_deleted.is_(False))
                .group_by(Course.id)
                .order_by(Course.created_at.desc())
                .limit(5)
            )
        ).all()
        courses = [
            {
                "id": course.id,
                "title": course.title,
                "is_published": course.is_published,
                "created_at": course.created_at,
                "student_count": int(student_count or 0),
            }
            for course, student_count in course_rows
        ]

        course_scope = select(Course.id).where(Course.instructor_id == instructor_id, Course.is_deleted.is_(False)).subquery()
        lesson_scope = select(Lesson.id).where(Lesson.course_id.in_(select(course_scope.c.id))).subquery()
        problem_scope = select(ProgrammingProblem.id).where(ProgrammingProblem.lesson_id.in_(select(lesson_scope.c.id))).subquery()

        return {
            "role": "instructor",
            "stats": {
                "created_courses": await _count(db, select(func.count()).select_from(course_scope)),
                "total_students": await _count(db, select(func.count(distinct(Enrollment.user_id))).where(Enrollment.course_id.in_(select(course_scope.c.id)))),
                "total_lessons": await _count(db, select(func.count()).select_from(lesson_scope)),
                "total_problems": await _count(db, select(func.count()).select_from(problem_scope)),
                "total_submissions": await _count(db, select(func.count(Submission.id)).where(Submission.problem_id.in_(select(problem_scope.c.id)))),
            },
            "courses": courses,
            "recent_submissions": await _recent_submissions(db, course_owner_id=instructor_id),
        }

    user_id = str(current_user.id)
    my_courses_rows = (
        await db.execute(
            select(Enrollment, Course)
            .join(Course, Enrollment.course_id == Course.id)
            .where(Enrollment.user_id == user_id, Course.is_deleted.is_(False))
            .order_by(Enrollment.enrolled_at.desc())
            .limit(5)
        )
    ).all()
    my_courses = [
        {
            "id": course.id,
            "title": course.title,
            "is_published": course.is_published,
            "created_at": course.created_at,
            "progress": enrollment.progress or 0,
        }
        for enrollment, course in my_courses_rows
    ]

    average_progress = (await db.execute(select(func.avg(Enrollment.progress)).where(Enrollment.user_id == user_id))).scalar() or 0

    return {
        "role": "student",
        "stats": {
            "enrolled_courses": await _count(db, select(func.count(Enrollment.id)).where(Enrollment.user_id == user_id)),
            "completed_courses": await _count(db, select(func.count(Enrollment.id)).where(Enrollment.user_id == user_id, Enrollment.status == "completed")),
            "average_progress": round(float(average_progress), 1),
            "total_submissions": await _count(db, select(func.count(Submission.id)).where(Submission.user_id == user_id)),
            "accepted_submissions": await _count(db, select(func.count(Submission.id)).where(Submission.user_id == user_id, Submission.status == SubmissionStatus.ACCEPTED.value)),
        },
        "my_courses": my_courses,
        "recent_submissions": await _recent_submissions(db, user_id=user_id),
    }
