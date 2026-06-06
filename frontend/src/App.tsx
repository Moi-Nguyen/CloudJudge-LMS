import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Common Pages
import DashboardPage from './pages/DashboardPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'

// Student Pages
import MyCoursesPage from './pages/student/MyCoursesPage'
import QuizPage from './pages/student/QuizPage'
import ProgrammingPage from './pages/student/ProgrammingPage'

// Instructor Pages
import CreateCoursePage from './pages/instructor/CreateCoursePage'
import EditCoursePage from './pages/instructor/EditCoursePage'
import CreateLessonPage from './pages/instructor/CreateLessonPage'
import CreateQuizPage from './pages/instructor/CreateQuizPage'
import CreateProblemPage from './pages/instructor/CreateProblemPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage'
import AdminUsersPage from './pages/admin/UsersPage'
import AdminCoursesPage from './pages/admin/CoursesPage'

// Components
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()

  // Initialize auth state from stored tokens
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Default redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Common */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:courseId" element={<CourseDetailPage />} />

            {/* Student Routes */}
            <Route path="my-courses" element={<MyCoursesPage />} />
            <Route path="quiz/:quizId" element={<QuizPage />} />
            <Route path="problem/:problemId" element={<ProgrammingPage />} />

            {/* Instructor Routes */}
            <Route path="instructor/create-course" element={<CreateCoursePage />} />
            <Route path="instructor/edit-course/:courseId" element={<EditCoursePage />} />
            <Route path="instructor/lesson/:courseId/new" element={<CreateLessonPage />} />
            <Route path="instructor/quiz/:lessonId/new" element={<CreateQuizPage />} />
            <Route path="instructor/problem/:lessonId/new" element={<CreateProblemPage />} />

            {/* Admin Routes */}
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/courses" element={<AdminCoursesPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
