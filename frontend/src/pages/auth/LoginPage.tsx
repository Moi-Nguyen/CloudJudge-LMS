import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, Cloud, Code2, GraduationCap, ShieldCheck, TerminalSquare, Server } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores'
import { isMockMode, isMockModeLockedByEnv } from '@/utils/mockAuth'
import { getRedirectPathByRole } from '@/stores/authStore'
import { cn } from '@/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { mockLogin } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [useMockAuth, setUseMockAuth] = useState(isMockMode())

  useEffect(() => {
    setUseMockAuth(isMockMode())
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleLoginSuccess = (userData: { role: 'admin' | 'instructor' | 'student' } | null) => {
    if (userData) {
      navigate(getRedirectPathByRole(userData.role))
    } else {
      navigate('/dashboard')
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const currentMockMode = isMockMode()

      if (currentMockMode) {
        const result = await mockLogin(data.email, data.password)
        if (result.success) {
          toast.success('Signed in successfully (Mock Mode)!')
          const { user } = useAuthStore.getState()
          handleLoginSuccess(user)
        } else {
          toast.error(result.error || 'Sign in failed')
        }
      } else {
        const { login, setTokens, logout } = useAuthStore.getState()
        const { authApi } = await import('@/api/endpoints')

        try {
          const response = await authApi.login(data)
          setTokens(response.access_token, response.refresh_token)
          const userData = await authApi.getMe()
          login(response.access_token, response.refresh_token, userData)
          toast.success('Signed in successfully!')
          handleLoginSuccess(userData)
        } catch (apiError: any) {
          if (apiError.response?.status === 401) {
            logout()
          }

          const message = apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network')
            ? 'Cannot connect to server. Check that the FastAPI backend is running.'
            : apiError.response?.status === 401
              ? 'Authentication failed. Please check your email and password.'
              : apiError.response?.data?.detail || 'Sign in failed'
          toast.error(message)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const mockModeLocked = isMockModeLockedByEnv()

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.18),transparent_28rem),radial-gradient(circle_at_82%_72%,rgba(124,58,237,0.18),transparent_30rem),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#faf5ff_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-8">
        <section className="relative hidden overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-300/30 blur-3xl" />
          <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-secondary-300/30 blur-3xl" />

          <div className="relative">
            <Link to="/login" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/25">
                <Cloud size={25} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-950">CloudJudge LMS</h1>
                <p className="text-sm text-slate-500">Cloud labs. Online judge. Learning paths.</p>
              </div>
            </Link>
          </div>

          <div className="relative my-10 rounded-[2rem] border border-white/80 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
            <div className="absolute right-6 top-6 flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-primary-100"><TerminalSquare size={14} /> Judge runtime</div>
            <div className="space-y-3 font-mono text-sm text-slate-300">
              <p><span className="text-emerald-300">status</span>: compiling submissions</p>
              <p><span className="text-primary-300">course</span>: cloud-native programming</p>
              <p><span className="text-purple-300">lab</span>: distributed systems fundamentals</p>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4"><Server className="mb-3 text-primary-200" size={22} /><p className="text-xs text-slate-300">Cloud labs</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><Code2 className="mb-3 text-emerald-200" size={22} /><p className="text-xs text-slate-300">Auto judge</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><GraduationCap className="mb-3 text-purple-200" size={22} /><p className="text-xs text-slate-300">LMS flow</p></div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3">
            {[['24/7', 'Practice'], ['1.2k+', 'Submissions'], ['Role based', 'Learning']].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-sm">
                <p className="text-lg font-bold text-slate-950">{value}</p>
                <p className="text-xs font-medium text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="flex items-center justify-center py-8 lg:py-0">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm">
                <ShieldCheck size={14} /> Secure learning workspace
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to manage courses, solve programming exercises, and continue your cloud learning journey.</p>
            </div>

            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input {...register('email')} type="email" placeholder="you@cloudjudge.com" className={cn('input pl-11', errors.email && 'input-error')} />
                  </div>
                  {errors.email && <p className="mt-2 text-sm font-medium text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="????????" className={cn('input pl-11 pr-11', errors.password && 'input-error')} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm font-medium text-red-600">{errors.password.message}</p>}
                </div>

                <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Need an account?{' '}
                <Link to="/register" className="font-semibold text-primary-700 transition hover:text-primary-800">Create one</Link>
              </p>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-white">
                  <input type="checkbox" checked={useMockAuth} disabled onChange={() => undefined} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50" />
                  <span className="text-sm font-medium text-slate-700">Use Mock Mode without backend{mockModeLocked ? ' (enabled by env)' : ' (set VITE_MOCK_AUTH=true)'}</span>
                </label>
                {useMockAuth && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-amber-900">Demo accounts</p>
                    <div className="space-y-1 text-xs text-amber-800">
                      <p><span className="font-mono">admin@cloudjudge.com</span> / admin123</p>
                      <p><span className="font-mono">instructor@cloudjudge.com</span> / instructor123</p>
                      <p><span className="font-mono">student@cloudjudge.com</span> / student123</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
