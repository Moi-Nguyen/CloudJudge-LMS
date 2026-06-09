import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores'
import { isMockMode, setMockMode, isMockModeLockedByEnv } from '@/utils/mockAuth'
import { getRedirectPathByRole } from '@/stores/authStore'
import { cn } from '@/utils'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { mockLogin } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [useMockAuth, setUseMockAuth] = useState(isMockMode())

  // Sync mock auth state when env changes
  useEffect(() => {
    const mode = isMockMode()
    console.log('[LoginPage] mount - isMockMode:', mode)
    setUseMockAuth(mode)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleLoginSuccess = (userData: { role: 'admin' | 'instructor' | 'student' } | null) => {
    if (userData) {
      const redirectPath = getRedirectPathByRole(userData.role)
      console.log('[LoginPage] redirecting to:', redirectPath)
      navigate(redirectPath)
    } else {
      console.log('[LoginPage] no user, redirecting to /dashboard')
      navigate('/dashboard')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      // THE SOURCE OF TRUTH: always check isMockMode() at submit time
      const currentMockMode = isMockMode()
      console.log('[LoginPage] onSubmit - isMockMode():', currentMockMode, '| checkbox state:', useMockAuth)

      if (currentMockMode) {
        // ==========================================
        // MOCK PATH - NO BACKEND CALLS WHATSOEVER
        // ==========================================
        console.log('[LoginPage] >>> MOCK LOGIN PATH - no backend calls')
        console.log('[LoginPage] calling validateMockCredentials + createMockTokens locally')

        const result = await mockLogin(data.email, data.password)
        if (result.success) {
          toast.success('Đăng nhập thành công (Mock Mode)!')
          const { user } = useAuthStore.getState()
          console.log('[LoginPage] mock login success, user role:', user?.role)
          handleLoginSuccess(user)
        } else {
          console.log('[LoginPage] mock login failed:', result.error)
          toast.error(result.error || 'Đăng nhập thất bại')
        }
      } else {
        // ==========================================
        // REAL API PATH
        // ==========================================
        console.log('[LoginPage] >>> API LOGIN PATH - calling backend')
        const { login } = useAuthStore.getState()

        // Dynamic import to avoid bundling authApi in mock mode
        const { authApi } = await import('@/api/endpoints')
        console.log('[LoginPage] authApi loaded, calling /auth/login')

        try {
          const response = await authApi.login(data)
          console.log('[LoginPage] /auth/login success, calling /auth/me')
          const userData = await authApi.getMe()
          login(response.access_token, response.refresh_token, userData)
          toast.success('Đăng nhập thành công!')
          handleLoginSuccess(userData)
        } catch (apiError: any) {
          console.log('[LoginPage] API login failed:', apiError.code, apiError.message)
          // If backend is unavailable, suggest mock mode
          if (apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network')) {
            toast.error('Không thể kết nối server. Bật Mock Mode để thử nghiệm.')
            setUseMockAuth(true)
            setMockMode(true)
          } else {
            const message = apiError.response?.data?.detail || 'Đăng nhập thất bại'
            toast.error(message)
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const mockModeLocked = isMockModeLockedByEnv()

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Đăng nhập</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              {...register('email')}
              type="email"
              placeholder="your@email.com"
              className={cn(
                'input pl-10',
                errors.email && 'input-error'
              )}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={cn(
                'input pl-10 pr-10',
                errors.password && 'input-error'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full py-3"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Đăng ký
        </Link>
      </p>

      {/* Mock Mode Toggle */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useMockAuth}
            disabled={mockModeLocked}
            onChange={(e) => {
              setUseMockAuth(e.target.checked)
              setMockMode(e.target.checked)
            }}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
          />
          <span className="text-sm text-gray-600">
            Dùng Mock Mode (không cần backend)
            {mockModeLocked && ' [bật sẵn]'}
          </span>
        </label>

        {useMockAuth && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-800 mb-2">Tài khoản demo:</p>
            <div className="text-xs text-amber-700 space-y-1">
              <p><span className="font-mono">admin@cloudjudge.com</span> / admin123</p>
              <p><span className="font-mono">instructor@cloudjudge.com</span> / instructor123</p>
              <p><span className="font-mono">student@cloudjudge.com</span> / student123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
