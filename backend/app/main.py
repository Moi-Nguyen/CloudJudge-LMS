from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .core.config import settings
from .core.database import init_db, close_db, engine
from .api.v1.router import api_router
from .schemas.common import HealthCheck


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Cloud-Native Learning Management System with Auto-Grading",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred",
        },
    )


# Health check endpoint
@app.get("/health", response_model=HealthCheck, tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return HealthCheck(
        status="healthy",
        version=settings.APP_VERSION,
        database="connected",
    )

@app.get("/ready", response_model=HealthCheck, tags=["Health"])
async def readiness_check():
    """Database readiness check endpoint."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "version": settings.APP_VERSION,
                "database": "disconnected",
            },
        )

    return HealthCheck(
        status="healthy",
        version=settings.APP_VERSION,
        database="connected",
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
