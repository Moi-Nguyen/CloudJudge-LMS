import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON, Boolean
from sqlalchemy.orm import relationship

from ..core.database import Base


class Quiz(Base):
    """Quiz model for quiz management."""

    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    lesson_id = Column(String(36), ForeignKey("lessons.id"), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    time_limit = Column(Integer, nullable=True)  # minutes
    max_attempts = Column(Integer, default=1)
    passing_score = Column(Integer, default=60)  # percentage
    shuffle_questions = Column(Boolean, default=False)
    show_correct_answers = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    lesson = relationship("Lesson", back_populates="quiz", lazy="selectin")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", lazy="selectin")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Quiz {self.title}>"


class QuizQuestion(Base):
    """Quiz question model."""

    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id"), nullable=False)
    question = Column(Text, nullable=False)
    question_type = Column(String(20), default="multiple_choice")  # multiple_choice, true_false
    options = Column(JSON, nullable=True)  # List of options
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=1)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    quiz = relationship("Quiz", back_populates="questions", lazy="selectin")
    answers = relationship("QuizAnswer", back_populates="question", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<QuizQuestion {self.id[:8]}>"


class QuizAttempt(Base):
    """Quiz attempt model for tracking user attempts."""

    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    score = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    percentage = Column(Integer, default=0)
    passed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    time_taken_seconds = Column(Integer, nullable=True)

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts", lazy="selectin")
    user = relationship("User", back_populates="quiz_attempts", lazy="selectin")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan", lazy="selectin")

    def __repr__(self) -> str:
        return f"<QuizAttempt {self.id[:8]}>"


class QuizAnswer(Base):
    """Quiz answer model for storing user answers."""

    __tablename__ = "quiz_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("quiz_questions.id"), nullable=False)
    selected_answer = Column(String(255), nullable=True)
    is_correct = Column(Boolean, default=False)
    points_earned = Column(Integer, default=0)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers", lazy="selectin")
    question = relationship("QuizQuestion", back_populates="answers", lazy="selectin")

    def __repr__(self) -> str:
        return f"<QuizAnswer {self.id[:8]}>"
