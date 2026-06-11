import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Enum, Boolean
from sqlalchemy.orm import relationship

from ..core.database import Base


class LessonType(str, PyEnum):
    """Lesson type enumeration."""
    VIDEO = "video"
    DOCUMENT = "document"
    QUIZ = "quiz"
    PROGRAMMING = "programming"


class Lesson(Base):
    """Lesson model for course content."""

    __tablename__ = "lessons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    lesson_type = Column(Enum(LessonType), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    file_url = Column(String(500), nullable=True)
    external_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(100), nullable=True)
    file_size = Column(Integer, nullable=True)
    storage_provider = Column(String(50), default="local", nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="lessons", lazy="selectin")
    quiz = relationship("Quiz", back_populates="lesson", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    problem = relationship("ProgrammingProblem", back_populates="lesson", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    documents = relationship("Document", back_populates="lesson", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Lesson {self.title}>"


class Document(Base):
    """Document model for lesson materials."""

    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = Column(String(36), ForeignKey("lessons.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    storage_provider = Column(String(20), default="local", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="documents", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Document {self.title}>"
