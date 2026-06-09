import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AuthLayout() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLogin) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe,_transparent_28rem),radial-gradient(circle_at_bottom_right,_#ede9fe,_transparent_30rem),linear-gradient(180deg,_#f8fafc,_#eef2ff)]">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary-700">CloudJudge LMS</h1>
            <p className="mt-2 text-slate-600">Cloud learning management for programming education</p>
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
