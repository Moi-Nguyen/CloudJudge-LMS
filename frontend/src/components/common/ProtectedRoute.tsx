import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children?: React.ReactNode
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isMockAuth } = useAuthStore()
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)


  // Prevent infinite loading - fallback after 5 seconds if backend unavailable
  useEffect(() => {

    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        const state = useAuthStore.getState()

        // If using mock auth or mock mode is enabled and we have tokens, stop loading
        if (state.isMockAuth || state.isAuthenticated) {
          useAuthStore.getState().setLoading(false)
        }
      }, 5000)
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If authenticated via mock mode, allow access
  if (isAuthenticated && isMockAuth) {
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath = getDashboardPathByRole(user.role)
      return <Navigate to={dashboardPath} replace />
    }
    return <>{children ?? <Outlet />}</>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children ?? <Outlet />}</>
}

function getDashboardPathByRole(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'instructor':
      return '/instructor'
    case 'student':
      return '/student'
    default:
      return '/dashboard'
  }
}
