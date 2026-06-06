import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship

from ..core.database import Base


class Course(Base):
    """Course model for managing courses."""

    __tablename__ = "courses"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    instructor_id = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    instructor = relationship("User", back_populates="courses_created", lazy="selectin")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", lazy="selectin")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Course {self.title}>"


class Enrollment(Base):
    """Enrollment model for course enrollments."""

    __tablename__ = "enrollments"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(CHAR(36), ForeignKey("courses.id"), nullable=False)
    status = Column(String(20), default="active")  # active, completed, dropped
    progress = Column(Integer, default=0)  # percentage 0-100
    enrolled_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="enrollments", lazy="selectin")
    course = relationship("Course", back_populates="enrollments", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Enrollment user={self.user_id} course={self.course_id}>"
