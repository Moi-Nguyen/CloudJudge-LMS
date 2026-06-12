from fastapi import APIRouter

from .endpoints import auth, users, courses, lessons, quizzes, problems, stats, dashboard, notifications


api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(courses.router)
api_router.include_router(lessons.router)
api_router.include_router(quizzes.router)
api_router.include_router(problems.router)
api_router.include_router(stats.router)
api_router.include_router(dashboard.router)
api_router.include_router(notifications.router)
