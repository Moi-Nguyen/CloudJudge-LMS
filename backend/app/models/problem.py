import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship

from ..core.database import Base


class SubmissionStatus(str, PyEnum):
    """Submission status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    ACCEPTED = "accepted"
    WRONG_ANSWER = "wrong_answer"
    TIME_LIMIT = "time_limit"
    MEMORY_LIMIT = "memory_limit"
    RUNTIME_ERROR = "runtime_error"
    COMPILE_ERROR = "compile_error"
    SYSTEM_ERROR = "system_error"


class ProgrammingProblem(Base):
    """Programming problem model."""

    __tablename__ = "programming_problems"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = Column(String(36), ForeignKey("lessons.id"), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=True)
    solution_code = Column(Text, nullable=True)
    language = Column(String(50), default="python")  # python, javascript, java, c++, go
    time_limit = Column(Integer, default=2000)  # milliseconds
    memory_limit = Column(Integer, default=256)  # MB
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="problem", lazy="selectin")
    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan", lazy="selectin")
    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ProgrammingProblem {self.title}>"


class TestCase(Base):
    """Test case model for programming problems."""

    __tablename__ = "test_cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id = Column(String(36), ForeignKey("programming_problems.id"), nullable=False)
    input = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    output = Column(Text, nullable=True)  # Actual output after running
    is_sample = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=True)
    points = Column(Integer, default=0)
    order = Column(Integer, default=0)
    execution_time = Column(Integer, nullable=True)  # milliseconds
    memory_used = Column(Integer, nullable=True)  # KB
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    problem = relationship("ProgrammingProblem", back_populates="test_cases", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TestCase {self.id[:8]}>"


class Submission(Base):
    """Submission model for code submissions."""

    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    problem_id = Column(String(36), ForeignKey("programming_problems.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String(50), nullable=False)
    status = Column(String(20), default=SubmissionStatus.PENDING)
    score = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    execution_time = Column(Integer, nullable=True)  # milliseconds
    memory_used = Column(Integer, nullable=True)  # KB
    error_message = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    graded_at = Column(DateTime, nullable=True)

    # Relationships
    problem = relationship("ProgrammingProblem", back_populates="submissions", lazy="selectin")
    user = relationship("User", back_populates="submissions", lazy="selectin")
    results = relationship("TestResult", back_populates="submission", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Submission {self.id[:8]}>"


class TestResult(Base):
    """Test result model for individual test case results."""

    __tablename__ = "test_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False)
    test_case_id = Column(String(36), ForeignKey("test_cases.id"), nullable=False)
    actual_output = Column(Text, nullable=True)
    status = Column(String(20), default="pending")
    execution_time = Column(Integer, nullable=True)
    memory_used = Column(Integer, nullable=True)
    points_earned = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    # Relationships
    submission = relationship("Submission", back_populates="results", lazy="selectin")
    test_case = relationship("TestCase", lazy="selectin")

    def __repr__(self) -> str:
        return f"<TestResult {self.id[:8]}>"
