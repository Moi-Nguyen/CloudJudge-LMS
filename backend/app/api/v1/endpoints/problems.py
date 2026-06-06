from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.dependencies import get_current_user, get_current_instructor
from ....models import User
from ....schemas.problem import (
    ProblemCreate,
    ProblemUpdate,
    ProblemResponse,
    ProblemDetailResponse,
    TestCaseCreate,
    TestCaseUpdate,
    TestCaseResponse,
    TestCaseBrief,
    SubmissionCreate,
    SubmissionResponse,
    SubmissionDetailResponse,
    SubmissionListResponse,
)
from ....schemas.common import MessageResponse
from ....services import ProblemService, SubmissionService
from ....errors import (
    ProblemNotFoundError,
    TestCaseNotFoundError,
    SubmissionNotFoundError,
    NotCourseOwnerError,
)


router = APIRouter(prefix="/problems", tags=["Programming Problems"])


# Problem endpoints
@router.post("", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(
    data: ProblemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Create a new programming problem (instructor/admin only)."""
    problem_service = ProblemService(db)
    try:
        problem = await problem_service.create(current_user.id, data)
        return ProblemResponse.model_validate(problem)
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.get("/{problem_id}", response_model=ProblemDetailResponse)
async def get_problem(
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get problem details."""
    problem_service = ProblemService(db)
    try:
        problem = await problem_service.get_by_id(problem_id)
        return ProblemDetailResponse.model_validate(problem)
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: UUID,
    data: ProblemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Update a problem (owner only)."""
    problem_service = ProblemService(db)
    try:
        problem = await problem_service.update(problem_id, current_user.id, data)
        return ProblemResponse.model_validate(problem)
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_problem(
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Delete a problem (owner only)."""
    problem_service = ProblemService(db)
    try:
        await problem_service.delete(problem_id, current_user.id)
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


# Test case endpoints
@router.post("/{problem_id}/testcases", response_model=TestCaseResponse, status_code=status.HTTP_201_CREATED)
async def add_test_case(
    problem_id: UUID,
    data: TestCaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Add a test case to a problem."""
    problem_service = ProblemService(db)
    try:
        testcase = await problem_service.add_test_case(problem_id, current_user.id, data)
        return TestCaseResponse.model_validate(testcase)
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.get("/{problem_id}/testcases", response_model=list[TestCaseBrief])
async def get_test_cases(
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get sample test cases for a problem (for students)."""
    problem_service = ProblemService(db)
    try:
        testcases = await problem_service.get_sample_test_cases(problem_id)
        return [TestCaseBrief.model_validate(tc) for tc in testcases]
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.put("/testcases/{testcase_id}", response_model=TestCaseResponse)
async def update_test_case(
    testcase_id: UUID,
    data: TestCaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Update a test case."""
    problem_service = ProblemService(db)
    try:
        testcase = await problem_service.update_test_case(testcase_id, current_user.id, data)
        return TestCaseResponse.model_validate(testcase)
    except TestCaseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/testcases/{testcase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_case(
    testcase_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_instructor),
):
    """Delete a test case."""
    problem_service = ProblemService(db)
    try:
        await problem_service.delete_test_case(testcase_id, current_user.id)
    except TestCaseNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except NotCourseOwnerError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


# Submission endpoints
@router.post("/{problem_id}/submit", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_solution(
    problem_id: UUID,
    data: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a solution for a problem."""
    submission_service = SubmissionService(db)
    try:
        submission = await submission_service.submit(current_user.id, data)
        return SubmissionResponse.model_validate(submission)
    except ProblemNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{problem_id}/submissions", response_model=SubmissionListResponse)
async def get_problem_submissions(
    problem_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get user's submissions for a problem."""
    submission_service = SubmissionService(db)
    submissions, total = await submission_service.get_user_submissions(
        current_user.id,
        problem_id=problem_id,
        page=page,
        page_size=page_size,
    )
    return {
        "submissions": [SubmissionResponse.model_validate(s) for s in submissions],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get("/submissions/my", response_model=SubmissionListResponse)
async def get_my_submissions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    problem_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all submissions for current user."""
    submission_service = SubmissionService(db)
    submissions, total = await submission_service.get_user_submissions(
        current_user.id,
        problem_id=problem_id,
        page=page,
        page_size=page_size,
    )
    return {
        "submissions": [SubmissionResponse.model_validate(s) for s in submissions],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
    }


@router.get("/submissions/{submission_id}", response_model=SubmissionDetailResponse)
async def get_submission(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get submission details."""
    submission_service = SubmissionService(db)
    try:
        submission = await submission_service.get_by_id(submission_id)
        # Only allow owner or instructor to view
        if str(submission.user_id) != str(current_user.id) and current_user.role.value not in ["admin", "instructor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied",
            )
        return SubmissionDetailResponse.model_validate(submission)
    except SubmissionNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
