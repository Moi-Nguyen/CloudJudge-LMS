import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">CloudJudge LMS</h1>
            <p className="text-gray-600 mt-2">Hệ thống quản lý học tập trên đám mây</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
