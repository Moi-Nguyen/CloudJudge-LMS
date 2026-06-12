from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from ..schemas.quiz import (
    QuizCreate,
    QuizUpdate,
    QuestionCreate,
    QuestionUpdate,
    QuizSubmission,
)
from ..repositories import (
    QuizRepository,
    QuizQuestionRepository,
    QuizAttemptRepository,
    QuizAnswerRepository,
    LessonRepository,
    CourseRepository,
    EnrollmentRepository,
)
from ..errors import (
    QuizNotFoundError,
    QuestionNotFoundError,
    AttemptNotFoundError,
    MaxAttemptsReachedError,
    QuizAlreadySubmittedError,
    NotCourseOwnerError,
    NotEnrolledError,
)


class QuizService:
    """Service for quiz management operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.quiz_repo = QuizRepository(db)
        self.question_repo = QuizQuestionRepository(db)
        self.attempt_repo = QuizAttemptRepository(db)
        self.answer_repo = QuizAnswerRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    async def create(self, instructor_id: UUID, data: QuizCreate, is_admin: bool = False) -> Quiz:
        """Create a new quiz."""
        # Verify lesson exists and user owns the course
        lesson = await self.lesson_repo.get_by_id(data.lesson_id)
        if not lesson:
            raise QuizNotFoundError("Lesson not found")

        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(instructor_id):
            raise NotCourseOwnerError()

        # Check if quiz already exists for this lesson
        existing = await self.quiz_repo.get_by_lesson(data.lesson_id)
        if existing:
            raise QuizAlreadySubmittedError("Quiz already exists for this lesson")

        quiz = Quiz(
            lesson_id=data.lesson_id,
            title=data.title,
            description=data.description,
            time_limit=data.time_limit,
            max_attempts=data.max_attempts,
            passing_score=data.passing_score,
            shuffle_questions=data.shuffle_questions,
            show_correct_answers=data.show_correct_answers,
        )
        return await self.quiz_repo.create(quiz)

    async def get_by_lesson(self, lesson_id: UUID) -> Quiz:
        """Get quiz by lesson ID."""
        quiz = await self.quiz_repo.get_by_lesson(lesson_id)
        if not quiz:
            raise QuizNotFoundError("Quiz not found for this lesson")
        return quiz

    async def get_by_id(self, quiz_id: UUID) -> Quiz:
        """Get quiz by ID with questions."""
        quiz = await self.quiz_repo.get_with_questions(quiz_id)
        if not quiz:
            raise QuizNotFoundError()
        return quiz


    async def get_for_editor(self, quiz_id: UUID, user_id: UUID, is_admin: bool = False) -> Quiz:
        """Get quiz details for an instructor/admin editor."""
        quiz = await self.get_by_id(quiz_id)
        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()
        return quiz

    async def get_for_student(self, quiz_id: UUID, student_id: UUID) -> Quiz:
        """Get quiz for student (without correct answers)."""
        quiz = await self.get_by_id(quiz_id)
        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        if not lesson:
            raise QuizNotFoundError("Quiz lesson not found")

        if not await self.enrollment_repo.is_enrolled(student_id, lesson.course_id):
            raise NotEnrolledError("Student is not enrolled in this course")

        if not quiz.questions:
            raise QuizNotFoundError("Quiz has no questions")

        return quiz

    async def update(
        self,
        quiz_id: UUID,
        user_id: UUID,
        data: QuizUpdate,
        is_admin: bool = False,
    ) -> Quiz:
        """Update a quiz."""
        quiz = await self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise QuizNotFoundError()

        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(quiz, field, value)
        quiz.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

        return await self.quiz_repo.update(quiz)

    async def delete(self, quiz_id: UUID, user_id: UUID, is_admin: bool = False) -> None:
        """Delete a quiz."""
        quiz = await self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise QuizNotFoundError()

        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        await self.quiz_repo.delete(quiz)

    async def add_question(
        self,
        quiz_id: UUID,
        user_id: UUID,
        data: QuestionCreate,
        is_admin: bool = False,
    ) -> QuizQuestion:
        """Add a question to a quiz."""
        quiz = await self.quiz_repo.get_by_id(quiz_id)
        if not quiz:
            raise QuizNotFoundError()

        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        question = QuizQuestion(
            quiz_id=quiz_id,
            question=data.question,
            question_type=data.question_type,
            options=data.options,
            correct_answer=data.correct_answer,
            explanation=data.explanation,
            points=data.points,
            order=data.order,
        )
        return await self.question_repo.create(question)

    async def update_question(
        self,
        question_id: UUID,
        user_id: UUID,
        data: QuestionUpdate,
        is_admin: bool = False,
    ) -> QuizQuestion:
        """Update a question."""
        question = await self.question_repo.get_by_id(question_id)
        if not question:
            raise QuestionNotFoundError()

        quiz = await self.quiz_repo.get_by_id(question.quiz_id)
        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(question, field, value)

        quiz.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.quiz_repo.update(quiz)
        return await self.question_repo.update(question)

    async def delete_question(self, question_id: UUID, user_id: UUID, is_admin: bool = False) -> None:
        """Delete a question."""
        question = await self.question_repo.get_by_id(question_id)
        if not question:
            raise QuestionNotFoundError()

        quiz = await self.quiz_repo.get_by_id(question.quiz_id)
        lesson = await self.lesson_repo.get_by_id(quiz.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        quiz.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await self.quiz_repo.update(quiz)
        await self.question_repo.delete(question)

    async def start_attempt(self, user_id: UUID, quiz_id: UUID) -> QuizAttempt:
        """Start a new quiz attempt."""
        quiz = await self.quiz_repo.get_with_questions(quiz_id)
        if not quiz:
            raise QuizNotFoundError()

        # Check max attempts
        attempt_count = await self.attempt_repo.count_user_attempts(quiz_id, user_id)
        if attempt_count >= quiz.max_attempts:
            raise MaxAttemptsReachedError()

        attempt = QuizAttempt(
            quiz_id=quiz_id,
            user_id=user_id,
            started_at=datetime.utcnow(),
        )
        return await self.attempt_repo.create(attempt)

    async def submit_attempt(
        self,
        attempt_id: UUID,
        user_id: UUID,
        submission: QuizSubmission,
    ) -> QuizAttempt:
        """Submit a quiz attempt."""
        attempt = await self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise AttemptNotFoundError()

        if str(attempt.user_id) != str(user_id):
            raise AttemptNotFoundError("Not your attempt")

        if attempt.submitted_at:
            raise QuizAlreadySubmittedError("Attempt already submitted")

        quiz = await self.quiz_repo.get_with_questions(attempt.quiz_id)

        # Calculate score
        total_points = 0
        earned_points = 0
        answers = []

        for answer_data in submission.answers:
            question = next(
                (q for q in quiz.questions if str(q.id) == str(answer_data.question_id)),
                None
            )
            if question:
                total_points += question.points
                is_correct = str(answer_data.selected_answer).strip() == str(question.correct_answer).strip()
                points = question.points if is_correct else 0
                earned_points += points

                answer = QuizAnswer(
                    attempt_id=attempt_id,
                    question_id=question.id,
                    selected_answer=answer_data.selected_answer,
                    is_correct=is_correct,
                    points_earned=points,
                )
                answers.append(answer)

        # Create answers
        await self.answer_repo.create_bulk(answers)

        # Update attempt
        attempt.score = earned_points
        attempt.total_points = total_points
        attempt.percentage = int((earned_points / total_points * 100) if total_points > 0 else 0)
        attempt.passed = attempt.percentage >= quiz.passing_score
        attempt.submitted_at = datetime.utcnow()

        # Calculate time taken
        if attempt.started_at:
            time_diff = attempt.submitted_at - attempt.started_at
            attempt.time_taken_seconds = int(time_diff.total_seconds())

        return await self.attempt_repo.update(attempt)

    async def get_attempt(self, attempt_id: UUID) -> QuizAttempt:
        """Get quiz attempt."""
        attempt = await self.attempt_repo.get_by_id(attempt_id)
        if not attempt:
            raise AttemptNotFoundError()
        return attempt

    async def get_user_attempts(
        self,
        user_id: UUID,
        quiz_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[QuizAttempt], int]:
        """Get all attempts for a user."""
        if quiz_id:
            attempts = await self.attempt_repo.get_user_attempt_for_quiz(quiz_id, user_id)
            total = len(attempts)
        else:
            attempts = await self.attempt_repo.get_recent_attempts(
                user_id,
                skip=(page-1)*page_size,
                limit=page_size,
            )
            total = len(attempts)
        return attempts, total

    async def get_best_attempt(self, user_id: UUID, quiz_id: UUID) -> Optional[QuizAttempt]:
        """Get the best attempt for a user."""
        return await self.attempt_repo.get_best_attempt(quiz_id, user_id)
