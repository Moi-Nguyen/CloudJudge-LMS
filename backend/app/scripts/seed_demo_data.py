import asyncio
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, close_db
from app.core.security import get_password_hash
from app.models import (
    Course,
    Enrollment,
    Lesson,
    LessonType,
    ProgrammingProblem,
    Quiz,
    QuizQuestion,
    Submission,
    SubmissionStatus,
    TestCase,
    User,
    UserRole,
)


@dataclass(frozen=True)
class SeedUser:
    email: str
    password: str
    full_name: str
    role: UserRole


SEED_USERS = (
    SeedUser("admin@test.com", "admin123456", "Demo Admin", UserRole.ADMIN),
    SeedUser("instructor@test.com", "instructor123456", "Demo Instructor", UserRole.INSTRUCTOR),
    SeedUser("student@test.com", "student123", "Demo Student", UserRole.STUDENT),
)

COURSES = {
    "Python Programming Basics": {
        "description": "A beginner-friendly course covering Python syntax, variables, and control flow.",
        "lessons": [
            "Introduction to Python",
            "Variables and Data Types",
            "Control Flow",
        ],
    },
    "Data Structures and Algorithms": {
        "description": "Core data structures and algorithmic thinking for programming problem solving.",
        "lessons": [
            "Arrays and Lists",
            "Stacks and Queues",
            "Basic Sorting",
        ],
    },
}


async def get_one(session: AsyncSession, model: Any, *conditions: Any) -> Any | None:
    result = await session.execute(select(model).where(*conditions))
    return result.scalar_one_or_none()


async def seed_users(session: AsyncSession) -> dict[str, User]:
    users: dict[str, User] = {}
    for seed_user in SEED_USERS:
        user = await get_one(session, User, User.email == seed_user.email)
        if user is None:
            user = User(
                email=seed_user.email,
                password_hash=get_password_hash(seed_user.password),
                full_name=seed_user.full_name,
                role=seed_user.role,
                is_active=True,
            )
            session.add(user)
        else:
            user.password_hash = get_password_hash(seed_user.password)
            user.full_name = seed_user.full_name
            user.role = seed_user.role
            user.is_active = True
        users[seed_user.email] = user

    await session.flush()
    return users


async def seed_courses(session: AsyncSession, instructor: User) -> dict[str, Course]:
    courses: dict[str, Course] = {}
    for title, data in COURSES.items():
        course = await get_one(session, Course, Course.title == title)
        if course is None:
            course = Course(
                title=title,
                description=data["description"],
                instructor_id=instructor.id,
                is_published=True,
                is_deleted=False,
            )
            session.add(course)
        else:
            course.description = data["description"]
            course.instructor_id = instructor.id
            course.is_published = True
            course.is_deleted = False
        courses[title] = course

    await session.flush()
    return courses


async def seed_enrollments(session: AsyncSession, student: User, courses: dict[str, Course]) -> None:
    course = courses["Python Programming Basics"]
    enrollment = await get_one(
        session,
        Enrollment,
        Enrollment.user_id == student.id,
        Enrollment.course_id == course.id,
    )
    if enrollment is None:
        session.add(Enrollment(user_id=student.id, course_id=course.id, status="active", progress=25))
    else:
        enrollment.status = "active"


async def seed_lessons(session: AsyncSession, courses: dict[str, Course]) -> dict[str, Lesson]:
    lessons: dict[str, Lesson] = {}
    for course_title, data in COURSES.items():
        course = courses[course_title]
        for index, title in enumerate(data["lessons"], start=1):
            lesson = await get_one(
                session,
                Lesson,
                Lesson.course_id == course.id,
                Lesson.title == title,
            )
            if lesson is None:
                lesson = Lesson(
                    course_id=course.id,
                    title=title,
                    description=f"Demo lesson for {title}.",
                    content=f"This lesson introduces {title.lower()} with short examples and practice prompts.",
                    lesson_type=LessonType.DOCUMENT,
                    order=index,
                    duration_minutes=15,
                )
                session.add(lesson)
            else:
                lesson.description = f"Demo lesson for {title}."
                lesson.content = f"This lesson introduces {title.lower()} with short examples and practice prompts."
                lesson.order = index
            lessons[title] = lesson

    await session.flush()
    return lessons


async def seed_problems(session: AsyncSession, lessons: dict[str, Lesson]) -> dict[str, ProgrammingProblem]:
    specs = {
        "A + B": {
            "lesson": lessons["Control Flow"],
            "description": "Read two integers and print their sum.",
            "starter_code": "a, b = map(int, input().split())\nprint(a + b)\n",
            "solution_code": "a, b = map(int, input().split())\nprint(a + b)\n",
        },
        "Sum of Array": {
            "lesson": lessons["Arrays and Lists"],
            "description": "Read n integers and print the sum of the array.",
            "starter_code": "n = int(input())\narr = list(map(int, input().split()))\nprint(sum(arr))\n",
            "solution_code": "n = int(input())\narr = list(map(int, input().split()))\nprint(sum(arr))\n",
        },
    }
    problems: dict[str, ProgrammingProblem] = {}
    for title, data in specs.items():
        problem = await get_one(session, ProgrammingProblem, ProgrammingProblem.title == title)
        if problem is None:
            problem = ProgrammingProblem(
                lesson_id=data["lesson"].id,
                title=title,
                description=data["description"],
                starter_code=data["starter_code"],
                solution_code=data["solution_code"],
                language="python",
                time_limit=2000,
                memory_limit=256,
                difficulty="easy",
            )
            session.add(problem)
        else:
            problem.lesson_id = data["lesson"].id
            problem.description = data["description"]
            problem.starter_code = data["starter_code"]
            problem.solution_code = data["solution_code"]
            problem.language = "python"
            problem.time_limit = 2000
            problem.memory_limit = 256
            problem.difficulty = "easy"
        problems[title] = problem

    await session.flush()
    return problems


async def seed_testcases(session: AsyncSession, problems: dict[str, ProgrammingProblem]) -> None:
    specs = {
        "A + B": [
            ("1 2", "3", True, False, 1),
            ("10 25", "35", False, True, 2),
        ],
        "Sum of Array": [
            ("5\n1 2 3 4 5", "15", True, False, 1),
            ("3\n10 -2 7", "15", False, True, 2),
        ],
    }
    for problem_title, cases in specs.items():
        problem = problems[problem_title]
        for input_value, expected_output, is_sample, is_hidden, order in cases:
            test_case = await get_one(
                session,
                TestCase,
                TestCase.problem_id == problem.id,
                TestCase.input == input_value,
            )
            if test_case is None:
                test_case = TestCase(problem_id=problem.id, input=input_value, expected_output=expected_output)
                session.add(test_case)
            test_case.expected_output = expected_output
            test_case.is_sample = is_sample
            test_case.is_hidden = is_hidden
            test_case.points = 50
            test_case.order = order
            test_case.status = "pending"


async def seed_quiz(session: AsyncSession, lessons: dict[str, Lesson]) -> None:
    lesson = lessons["Variables and Data Types"]
    quiz = await get_one(session, Quiz, Quiz.lesson_id == lesson.id)
    if quiz is None:
        quiz = Quiz(
            lesson_id=lesson.id,
            title="Python Basics Quiz",
            description="A short quiz about basic Python concepts.",
            time_limit=10,
            max_attempts=3,
            passing_score=60,
            shuffle_questions=False,
            show_correct_answers=True,
        )
        session.add(quiz)
    else:
        quiz.title = "Python Basics Quiz"
        quiz.description = "A short quiz about basic Python concepts."
    await session.flush()

    questions = [
        ("Which keyword defines a function in Python?", ["def", "func", "function", "lambda"], "def", 1),
        ("Python lists can store multiple values.", ["true", "false"], "true", 2),
    ]
    for question_text, options, correct_answer, order in questions:
        question = await get_one(
            session,
            QuizQuestion,
            QuizQuestion.quiz_id == quiz.id,
            QuizQuestion.question == question_text,
        )
        if question is None:
            question = QuizQuestion(quiz_id=quiz.id, question=question_text)
            session.add(question)
        question.question_type = "true_false" if options == ["true", "false"] else "multiple_choice"
        question.options = options
        question.correct_answer = correct_answer
        question.explanation = "Demo explanation for frontend preview."
        question.points = 1
        question.order = order


async def seed_submission(session: AsyncSession, student: User, problems: dict[str, ProgrammingProblem]) -> None:
    problem = problems["A + B"]
    existing = await get_one(
        session,
        Submission,
        Submission.user_id == student.id,
        Submission.problem_id == problem.id,
        Submission.code == "a, b = map(int, input().split())\nprint(a + b)\n",
    )
    if existing is None:
        session.add(
            Submission(
                user_id=student.id,
                problem_id=problem.id,
                code="a, b = map(int, input().split())\nprint(a + b)\n",
                language="python",
                status=SubmissionStatus.ACCEPTED.value,
                score=100,
                total_points=100,
                execution_time=20,
                memory_used=1024,
            )
        )


async def collect_counts(session: AsyncSession) -> dict[str, int]:
    models = {
        "users": User,
        "courses": Course,
        "enrollments": Enrollment,
        "lessons": Lesson,
        "problems": ProgrammingProblem,
        "testcases": TestCase,
        "quizzes": Quiz,
        "quiz_questions": QuizQuestion,
        "submissions": Submission,
    }
    counts: dict[str, int] = {}
    for name, model in models.items():
        result = await session.execute(select(func.count()).select_from(model))
        counts[name] = result.scalar_one()
    return counts


async def seed_demo_data() -> dict[str, int]:
    async with AsyncSessionLocal() as session:
        users = await seed_users(session)
        courses = await seed_courses(session, users["instructor@test.com"])
        await seed_enrollments(session, users["student@test.com"], courses)
        lessons = await seed_lessons(session, courses)
        problems = await seed_problems(session, lessons)
        await seed_testcases(session, problems)
        await seed_quiz(session, lessons)
        await seed_submission(session, users["student@test.com"], problems)
        await session.commit()
        return await collect_counts(session)


if __name__ == "__main__":
    async def main() -> None:
        try:
            counts = await seed_demo_data()
            print("Seed demo data completed.")
            for name, count in counts.items():
                print(f"{name}: {count}")
        finally:
            await close_db()

    asyncio.run(main())
