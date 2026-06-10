// User types
export type UserRole = 'admin' | 'instructor' | 'student'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  bio?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserBrief {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  role?: UserRole
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

// Course types
export interface Course {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  instructor_id: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface CourseDetail extends Course {
  instructor: UserBrief
  lesson_count: number
  student_count: number
}

export interface CourseCreate {
  title: string
  description?: string
  thumbnail_url?: string
}

export interface CourseUpdate {
  title?: string
  description?: string
  thumbnail_url?: string
  is_published?: boolean
}

// Enrollment types
export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  status: 'active' | 'completed' | 'dropped'
  progress: number
  enrolled_at: string
  completed_at?: string
}

export interface EnrollmentWithCourse extends Enrollment {
  course: Course
}

// Lesson types
export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  content?: string
  lesson_type: 'video' | 'document' | 'quiz' | 'programming'
  order: number
  duration_minutes?: number
  created_at: string
  updated_at: string
}

export interface LessonDetail extends Lesson {
  documents: Document[]
}

export interface Document {
  id: string
  lesson_id: string
  title: string
  file_url: string
  file_type?: string
  file_size?: number
  created_at: string
}

// Quiz types
export interface Quiz {
  id: string
  lesson_id: string
  title: string
  description?: string
  time_limit?: number
  max_attempts: number
  passing_score: number
  shuffle_questions: boolean
  show_correct_answers: boolean
  created_at: string
  updated_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  question_type: 'multiple_choice' | 'true_false'
  options?: { key: string; value: string }[]
  correct_answer: string
  explanation?: string
  points: number
  order: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  total_points: number
  percentage: number
  passed: boolean
  started_at: string
  submitted_at?: string
  time_taken_seconds?: number
}

export interface AnswerSubmission {
  question_id: string
  selected_answer: string
}

export interface QuizSubmission {
  answers: AnswerSubmission[]
}

// Problem types
export interface Problem {
  id: string
  lesson_id: string
  title: string
  description: string
  starter_code?: string
  language: string
  time_limit: number
  memory_limit: number
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
  updated_at: string
}

export interface TestCase {
  id: string
  problem_id: string
  input: string
  expected_output: string
  is_sample: boolean
  is_hidden: boolean
  points: number
  order: number
}

export type SubmissionStatus =
  | 'pending'
  | 'running'
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit'
  | 'memory_limit'
  | 'runtime_error'
  | 'compile_error'
  | 'system_error'

export interface Submission {
  id: string
  problem_id: string
  user_id: string
  code: string
  language: string
  status: SubmissionStatus
  score: number
  total_points: number
  execution_time?: number
  memory_used?: number
  error_message?: string
  submitted_at: string
  graded_at?: string
}

export interface SubmissionCreate {
  problem_id: string
  code: string
  language: string
}

// Stats types
export interface StatsOverview {
  total_users: number
  total_courses: number
  total_enrollments: number
  total_submissions: number
  total_quizzes: number
  active_users_today: number
  new_users_this_month: number
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
