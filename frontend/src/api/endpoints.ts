import api from './client'
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  UserBrief,
  Course,
  CourseDetail,
  CourseCreate,
  CourseUpdate,
  Enrollment,
  EnrollmentWithCourse,
  Lesson,
  LessonDetail,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizSubmission,
  Problem,
  TestCase,
  Submission,
  SubmissionCreate,
  ListResponse,
  StatsOverview,
} from '@/types'

type ListKey = 'items' | 'users' | 'courses' | 'enrollments' | 'lessons' | 'attempts' | 'submissions'

type BackendListResponse<T> = Partial<Record<ListKey, T[]>> & Omit<ListResponse<T>, 'items'>

const normalizeListResponse = <T>(data: BackendListResponse<T>, listKey: ListKey): ListResponse<T> => ({
  items: data.items ?? data[listKey] ?? [],
  total: data.total ?? 0,
  page: data.page ?? 1,
  page_size: data.page_size ?? 0,
  total_pages: data.total_pages ?? 1,
})

// Auth API
export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  getMe: async (): Promise<UserBrief> => {
    const response = await api.get('/users/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
}

// Users API
export const usersApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/me')
    return response.data
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`)
    return response.data
  },

  listUsers: async (params?: {
    page?: number
    page_size?: number
    role?: string
    is_active?: boolean
    search?: string
  }): Promise<ListResponse<User>> => {
    const response = await api.get('/users', { params })
    return normalizeListResponse<User>(response.data, 'users')
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, data)
    return response.data
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`)
  },

  toggleUserActive: async (userId: string): Promise<User> => {
    const response = await api.post(`/users/${userId}/toggle-active`)
    return response.data
  },
}

// Courses API
export const coursesApi = {
  listCourses: async (params?: {
    page?: number
    page_size?: number
    search?: string
  }): Promise<ListResponse<Course>> => {
    const response = await api.get('/courses', { params })
    return normalizeListResponse<Course>(response.data, 'courses')
  },

  getCourse: async (courseId: string): Promise<CourseDetail> => {
    const response = await api.get(`/courses/${courseId}`)
    return response.data
  },

  createCourse: async (data: CourseCreate): Promise<Course> => {
    const response = await api.post('/courses', data)
    return response.data
  },

  updateCourse: async (courseId: string, data: CourseUpdate): Promise<Course> => {
    const response = await api.put(`/courses/${courseId}`, data)
    return response.data
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`)
  },

  getMyCourses: async (params?: {
    page?: number
    page_size?: number
    status?: string
  }): Promise<ListResponse<EnrollmentWithCourse>> => {
    const response = await api.get('/courses/my', { params })
    return normalizeListResponse<EnrollmentWithCourse>(response.data, 'enrollments')
  },

  getMyCreatedCourses: async (params?: {
    page?: number
    page_size?: number
  }): Promise<ListResponse<Course>> => {
    const response = await api.get('/courses/my/created', { params })
    return normalizeListResponse<Course>(response.data, 'courses')
  },

  enrollInCourse: async (courseId: string): Promise<Enrollment> => {
    const response = await api.post(`/courses/${courseId}/enroll`)
    return response.data
  },

  unenrollFromCourse: async (courseId: string): Promise<void> => {
    await api.post(`/courses/${courseId}/unenroll`)
  },

  getCourseProgress: async (courseId: string): Promise<Enrollment> => {
    const response = await api.get(`/courses/${courseId}/progress`)
    return response.data
  },
}

// Lessons API
export const lessonsApi = {
  getCourseLessons: async (courseId: string, params?: {
    page?: number
    page_size?: number
  }): Promise<ListResponse<Lesson>> => {
    const response = await api.get(`/lessons/course/${courseId}`, { params })
    return normalizeListResponse<Lesson>(response.data, 'lessons')
  },

  getLesson: async (lessonId: string): Promise<LessonDetail> => {
    const response = await api.get(`/lessons/${lessonId}`)
    return response.data
  },

  createLesson: async (data: {
    course_id: string
    title: string
    description?: string
    content?: string
    lesson_type: string
    order?: number
    duration_minutes?: number
  }): Promise<Lesson> => {
    const response = await api.post('/lessons', data)
    return response.data
  },

  updateLesson: async (lessonId: string, data: Partial<Lesson>): Promise<Lesson> => {
    const response = await api.put(`/lessons/${lessonId}`, data)
    return response.data
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    await api.delete(`/lessons/${lessonId}`)
  },
}

// Quizzes API
export const quizzesApi = {
  getQuiz: async (quizId: string): Promise<Quiz & { questions: QuizQuestion[] }> => {
    const response = await api.get(`/quizzes/${quizId}`)
    return response.data
  },

  getQuizForStudent: async (quizId: string): Promise<Quiz & { questions: QuizQuestion[] }> => {
    const response = await api.get(`/quizzes/${quizId}/student`)
    return response.data
  },

  createQuiz: async (data: {
    lesson_id: string
    title: string
    description?: string
    time_limit?: number
    max_attempts?: number
    passing_score?: number
    shuffle_questions?: boolean
    show_correct_answers?: boolean
  }): Promise<Quiz> => {
    const response = await api.post('/quizzes', data)
    return response.data
  },

  updateQuiz: async (quizId: string, data: Partial<Quiz>): Promise<Quiz> => {
    const response = await api.put(`/quizzes/${quizId}`, data)
    return response.data
  },

  deleteQuiz: async (quizId: string): Promise<void> => {
    await api.delete(`/quizzes/${quizId}`)
  },

  addQuestion: async (quizId: string, data: {
    question: string
    question_type: string
    options?: { key: string; value: string }[]
    correct_answer: string
    explanation?: string
    points?: number
    order?: number
  }): Promise<QuizQuestion> => {
    const response = await api.post(`/quizzes/${quizId}/questions`, data)
    return response.data
  },

  updateQuestion: async (questionId: string, data: Partial<QuizQuestion>): Promise<QuizQuestion> => {
    const response = await api.put(`/quizzes/questions/${questionId}`, data)
    return response.data
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    await api.delete(`/quizzes/questions/${questionId}`)
  },

  startAttempt: async (quizId: string): Promise<QuizAttempt> => {
    const response = await api.post(`/quizzes/${quizId}/attempt`)
    return response.data
  },

  submitQuiz: async (quizId: string, attemptId: string, data: QuizSubmission): Promise<{
    attempt: QuizAttempt
    show_correct_answers: boolean
  }> => {
    const response = await api.post(`/quizzes/${quizId}/submit?attempt_id=${attemptId}`, data)
    return response.data
  },

  getAttempts: async (quizId: string, params?: {
    page?: number
    page_size?: number
  }): Promise<ListResponse<QuizAttempt>> => {
    const response = await api.get(`/quizzes/${quizId}/attempts`, { params })
    return response.data
  },

  getMyAttempts: async (params?: {
    page?: number
    page_size?: number
  }): Promise<ListResponse<QuizAttempt>> => {
    const response = await api.get('/quizzes/attempts/my', { params })
    return response.data
  },
}

// Problems API
export const problemsApi = {
  getProblem: async (problemId: string): Promise<Problem & { test_cases: TestCase[] }> => {
    const response = await api.get(`/problems/${problemId}`)
    return response.data
  },

  createProblem: async (data: {
    lesson_id: string
    title: string
    description: string
    starter_code?: string
    language?: string
    time_limit?: number
    memory_limit?: number
    difficulty?: string
  }): Promise<Problem> => {
    const response = await api.post('/problems', data)
    return response.data
  },

  updateProblem: async (problemId: string, data: Partial<Problem>): Promise<Problem> => {
    const response = await api.put(`/problems/${problemId}`, data)
    return response.data
  },

  deleteProblem: async (problemId: string): Promise<void> => {
    await api.delete(`/problems/${problemId}`)
  },

  addTestCase: async (problemId: string, data: {
    input: string
    expected_output: string
    is_sample?: boolean
    is_hidden?: boolean
    points?: number
  }): Promise<TestCase> => {
    const response = await api.post(`/problems/${problemId}/testcases`, data)
    return response.data
  },

  submitSolution: async (data: SubmissionCreate): Promise<Submission> => {
    const response = await api.post(`/problems/${data.problem_id}/submit`, {
      code: data.code,
      language: data.language,
    })
    return response.data
  },

  getMySubmissions: async (params?: {
    page?: number
    page_size?: number
    problem_id?: string
  }): Promise<ListResponse<Submission>> => {
    const response = await api.get('/problems/submissions/my', { params })
    return normalizeListResponse<Submission>(response.data, 'submissions')
  },
}

// Stats API
export const statsApi = {
  getOverview: async (): Promise<StatsOverview> => {
    const response = await api.get('/stats/overview')
    return response.data
  },
}
