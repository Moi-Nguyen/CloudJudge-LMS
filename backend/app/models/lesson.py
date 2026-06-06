import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Enum
from sqlalchemy.dialects.mysql import CHAR
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

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(CHAR(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    lesson_type = Column(Enum(LessonType), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
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

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = Column(CHAR(36), ForeignKey("lessons.id"), nullable=False)
    title = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="documents", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Document {self.title}>"
