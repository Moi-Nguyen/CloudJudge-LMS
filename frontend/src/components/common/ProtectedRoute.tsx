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

  // TEMPORARY: trace render
  console.log('[ProtectedRoute] RENDER - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'isMockAuth:', isMockAuth, 'userRole:', user?.role)

  // Prevent infinite loading - fallback after 5 seconds if backend unavailable
  useEffect(() => {
    console.log('[ProtectedRoute] useEffect - isLoading:', isLoading)

    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        const state = useAuthStore.getState()
        console.log('[ProtectedRoute] 5s timeout - state:', { isMockAuth: state.isMockAuth, isAuthenticated: state.isAuthenticated, hasUser: !!state.user })

        // If using mock auth or mock mode is enabled and we have tokens, stop loading
        if (state.isMockAuth || state.isAuthenticated) {
          console.log('[ProtectedRoute] 5s timeout - FORCING loading false')
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
    console.log('[ProtectedRoute] RETURNING loading spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If authenticated via mock mode, allow access
  if (isAuthenticated && isMockAuth) {
    console.log('[ProtectedRoute] MOCK AUTH - allowing access')
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath = getDashboardPathByRole(user.role)
      return <Navigate to={dashboardPath} replace />
    }
    return <>{children ?? <Outlet />}</>
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] NOT AUTHENTICATED - redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  console.log('[ProtectedRoute] RETURNING children')
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
