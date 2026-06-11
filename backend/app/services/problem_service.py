from typing import Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ProgrammingProblem, TestCase, Submission, TestResult, SubmissionStatus
from ..schemas.problem import (
    ProblemCreate,
    ProblemUpdate,
    TestCaseCreate,
    TestCaseUpdate,
    SubmissionCreate,
)
from ..repositories import (
    ProblemRepository,
    TestCaseRepository,
    SubmissionRepository,
    TestResultRepository,
    LessonRepository,
    CourseRepository,
    EnrollmentRepository,
)
from ..errors import (
    ProblemNotFoundError,
    TestCaseNotFoundError,
    SubmissionNotFoundError,
    NotCourseOwnerError,
)


class ProblemService:
    """Service for programming problem management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.problem_repo = ProblemRepository(db)
        self.testcase_repo = TestCaseRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    async def create(self, instructor_id: UUID, data: ProblemCreate, is_admin: bool = False) -> ProgrammingProblem:
        """Create a new programming problem."""
        lesson = await self.lesson_repo.get_by_id(data.lesson_id)
        if not lesson:
            raise ProblemNotFoundError("Lesson not found")

        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(instructor_id):
            raise NotCourseOwnerError()

        problem = ProgrammingProblem(
            lesson_id=data.lesson_id,
            title=data.title,
            description=data.description,
            starter_code=data.starter_code,
            language=data.language,
            time_limit=data.time_limit,
            memory_limit=data.memory_limit,
            difficulty=data.difficulty,
        )
        return await self.problem_repo.create(problem)

    async def get_by_id(self, problem_id: UUID) -> ProgrammingProblem:
        """Get problem by ID."""
        problem = await self.problem_repo.get_with_test_cases(problem_id)
        if not problem:
            raise ProblemNotFoundError()
        return problem

    async def get_by_course(
        self,
        course_id: UUID,
        user_id: UUID,
        user_role: str,
        page: int = 1,
        page_size: int = 100,
    ) -> tuple[list[ProgrammingProblem], int]:
        """Get problems for a course when the user can view that course."""
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise ProblemNotFoundError("Course not found")

        is_admin = user_role == "admin"
        is_owner = str(course.instructor_id) == str(user_id)
        enrollment = await self.enrollment_repo.get_by_user_and_course(user_id, course_id)
        can_view = is_admin or is_owner or (course.is_published and enrollment is not None)

        if not can_view:
            raise NotCourseOwnerError()

        skip = (page - 1) * page_size
        problems = await self.problem_repo.get_by_course(course_id, skip=skip, limit=page_size)
        total = await self.problem_repo.count_by_course(course_id)
        return problems, total

    async def update(
        self,
        problem_id: UUID,
        user_id: UUID,
        data: ProblemUpdate,
        is_admin: bool = False,
    ) -> ProgrammingProblem:
        """Update a problem."""
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise ProblemNotFoundError()

        lesson = await self.lesson_repo.get_by_id(problem.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(problem, field, value)

        return await self.problem_repo.update(problem)

    async def delete(self, problem_id: UUID, user_id: UUID, is_admin: bool = False) -> None:
        """Delete a problem."""
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise ProblemNotFoundError()

        lesson = await self.lesson_repo.get_by_id(problem.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        await self.problem_repo.delete(problem)

    async def add_test_case(
        self,
        problem_id: UUID,
        user_id: UUID,
        data: TestCaseCreate,
        is_admin: bool = False,
    ) -> TestCase:
        """Add a test case to a problem."""
        problem = await self.problem_repo.get_by_id(problem_id)
        if not problem:
            raise ProblemNotFoundError()

        lesson = await self.lesson_repo.get_by_id(problem.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        testcase = TestCase(
            problem_id=problem_id,
            input=data.input,
            expected_output=data.expected_output,
            is_sample=data.is_sample,
            is_hidden=data.is_hidden,
            points=data.points,
        )
        return await self.testcase_repo.create(testcase)

    async def update_test_case(
        self,
        testcase_id: UUID,
        user_id: UUID,
        data: TestCaseUpdate,
        is_admin: bool = False,
    ) -> TestCase:
        """Update a test case."""
        testcase = await self.testcase_repo.get_by_id(testcase_id)
        if not testcase:
            raise TestCaseNotFoundError()

        problem = await self.problem_repo.get_by_id(testcase.problem_id)
        lesson = await self.lesson_repo.get_by_id(problem.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(testcase, field, value)

        return await self.testcase_repo.update(testcase)

    async def delete_test_case(self, testcase_id: UUID, user_id: UUID, is_admin: bool = False) -> None:
        """Delete a test case."""
        testcase = await self.testcase_repo.get_by_id(testcase_id)
        if not testcase:
            raise TestCaseNotFoundError()

        problem = await self.problem_repo.get_by_id(testcase.problem_id)
        lesson = await self.lesson_repo.get_by_id(problem.lesson_id)
        course = await self.course_repo.get_by_id(lesson.course_id)
        if not is_admin and str(course.instructor_id) != str(user_id):
            raise NotCourseOwnerError()

        await self.testcase_repo.delete(testcase)

    async def get_sample_test_cases(self, problem_id: UUID) -> list[TestCase]:
        """Get sample test cases for display to students."""
        return await self.testcase_repo.get_sample_cases(problem_id)


class SubmissionService:
    """Service for code submission and grading."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self.testresult_repo = TestResultRepository(db)
        self.problem_repo = ProblemRepository(db)
        self.testcase_repo = TestCaseRepository(db)

    async def submit(
        self,
        user_id: UUID,
        data: SubmissionCreate,
    ) -> Submission:
        """
        Submit code for a problem.
        In production, this would queue the submission for async grading.
        """
        problem = await self.problem_repo.get_with_test_cases(data.problem_id)
        if not problem:
            raise ProblemNotFoundError()

        submission = Submission(
            problem_id=data.problem_id,
            user_id=user_id,
            code=data.code,
            language=data.language,
            status=SubmissionStatus.PENDING,
            submitted_at=datetime.utcnow(),
        )
        submission = await self.submission_repo.create(submission)

        # In production, this would trigger async grading
        # For now, we'll do a simple synchronous pass/fail check
        await self._grade_submission(submission, problem)

        return submission

    async def _grade_submission(
        self,
        submission: Submission,
        problem: ProgrammingProblem,
    ) -> None:
        """Grade a submission (simplified version)."""
        # Get visible test cases
        test_cases = await self.testcase_repo.get_by_problem(
            problem.id,
            include_hidden=True,  # In real system, exclude hidden for students
        )

        total_points = sum(tc.points for tc in test_cases)
        earned_points = 0
        all_passed = True

        for tc in test_cases:
            # Simplified grading - in production, this would run the code
            # with proper sandboxing
            result = TestResult(
                submission_id=submission.id,
                test_case_id=tc.id,
                status="accepted" if all_passed else "wrong_answer",
                actual_output=tc.expected_output,  # Simplified
                points_earned=tc.points if all_passed else 0,
            )
            await self.testresult_repo.create(result)

            if not all_passed:
                earned_points += tc.points

        # Update submission
        submission.status = SubmissionStatus.ACCEPTED if all_passed else SubmissionStatus.WRONG_ANSWER
        submission.score = earned_points
        submission.total_points = total_points
        submission.graded_at = datetime.utcnow()

        await self.submission_repo.update(submission)

    async def get_by_id(self, submission_id: UUID) -> Submission:
        """Get submission by ID."""
        submission = await self.submission_repo.get_with_results(submission_id)
        if not submission:
            raise SubmissionNotFoundError()
        return submission

    async def get_user_submissions(
        self,
        user_id: UUID,
        problem_id: Optional[UUID] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Submission], int]:
        """Get submissions for a user."""
        submissions = await self.submission_repo.get_user_submissions(
            user_id,
            problem_id=problem_id,
            status=status,
            skip=(page-1)*page_size,
            limit=page_size,
        )
        total = len(submissions)  # Simplified
        return submissions, total

    async def get_problem_submissions(
        self,
        problem_id: UUID,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Submission], int]:
        """Get all submissions for a problem."""
        submissions = await self.submission_repo.get_problem_submissions(
            problem_id,
            skip=(page-1)*page_size,
            limit=page_size,
        )
        total = await self.submission_repo.count_by_problem(problem_id)
        return submissions, total

    async def get_recent(self, limit: int = 50) -> list[Submission]:
        """Get recent submissions."""
        return await self.submission_repo.get_recent(limit=limit)
