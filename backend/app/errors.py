class CloudJudgeException(Exception):
    """Base exception for CloudJudge LMS."""
    def __init__(self, message: str = "An error occurred"):
        self.message = message
        super().__init__(self.message)


class NotFoundError(CloudJudgeException):
    """Resource not found error."""
    pass


class AlreadyExistsError(CloudJudgeException):
    """Resource already exists error."""
    pass


class AuthenticationError(CloudJudgeException):
    """Authentication error."""
    pass


class AuthorizationError(CloudJudgeException):
    """Authorization error."""
    pass


# User errors
class UserNotFoundError(NotFoundError):
    def __init__(self, message: str = "User not found"):
        super().__init__(message)


class EmailAlreadyExistsError(AlreadyExistsError):
    def __init__(self, message: str = "Email already registered"):
        super().__init__(message)


class InvalidCredentialsError(AuthenticationError):
    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message)


class UserAlreadyExistsError(AlreadyExistsError):
    def __init__(self, message: str = "User already exists"):
        super().__init__(message)


# Course errors
class CourseNotFoundError(NotFoundError):
    def __init__(self, message: str = "Course not found"):
        super().__init__(message)


class NotCourseOwnerError(AuthorizationError):
    def __init__(self, message: str = "You are not the owner of this course"):
        super().__init__(message)


class AlreadyEnrolledError(AlreadyExistsError):
    def __init__(self, message: str = "Already enrolled in this course"):
        super().__init__(message)


class NotEnrolledError(NotFoundError):
    def __init__(self, message: str = "Not enrolled in this course"):
        super().__init__(message)


# Lesson errors
class LessonNotFoundError(NotFoundError):
    def __init__(self, message: str = "Lesson not found"):
        super().__init__(message)


# Quiz errors
class QuizNotFoundError(NotFoundError):
    def __init__(self, message: str = "Quiz not found"):
        super().__init__(message)


class QuestionNotFoundError(NotFoundError):
    def __init__(self, message: str = "Question not found"):
        super().__init__(message)


class AttemptNotFoundError(NotFoundError):
    def __init__(self, message: str = "Attempt not found"):
        super().__init__(message)


class MaxAttemptsReachedError(CloudJudgeException):
    def __init__(self, message: str = "Maximum attempts reached"):
        super().__init__(message)


class QuizAlreadySubmittedError(CloudJudgeException):
    def __init__(self, message: str = "Quiz already submitted"):
        super().__init__(message)


# Problem errors
class ProblemNotFoundError(NotFoundError):
    def __init__(self, message: str = "Problem not found"):
        super().__init__(message)


class TestCaseNotFoundError(NotFoundError):
    def __init__(self, message: str = "Test case not found"):
        super().__init__(message)


class SubmissionNotFoundError(NotFoundError):
    def __init__(self, message: str = "Submission not found"):
        super().__init__(message)


# Document errors
class DocumentNotFoundError(NotFoundError):
    def __init__(self, message: str = "Document not found"):
        super().__init__(message)


# File errors
class FileUploadError(CloudJudgeException):
    def __init__(self, message: str = "File upload failed"):
        super().__init__(message)


class FileNotAllowedError(CloudJudgeException):
    def __init__(self, message: str = "File type not allowed"):
        super().__init__(message)


class FileTooLargeError(CloudJudgeException):
    def __init__(self, message: str = "File size exceeds limit"):
        super().__init__(message)
