import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, GraduationCap, Code, TrendingUp, Clock, ArrowRight, Activity } from 'lucide-react'
import { statsApi } from '@/api/endpoints'
import { isMockMode } from '@/utils/mockAuth'
import type { StatsOverview } from '@/types'

const MOCK_STATS: StatsOverview = {
  total_users: 156,
  total_courses: 24,
  total_enrollments: 489,
  total_submissions: 1250,
  total_quizzes: 18,
  active_users_today: 42,
  new_users_this_month: 23,
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const mockMode = isMockMode()

  useEffect(() => {
    const fetchStats = async () => {
      if (mockMode) {
        setStats(MOCK_STATS)
        setLoading(false)
        return
      }

      try {
        const data = await statsApi.getOverview()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [mockMode])

  const statCards = [
    { label: 'Total users', value: stats?.total_users || 0, icon: Users, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Total courses', value: stats?.total_courses || 0, icon: BookOpen, tone: 'from-violet-500 to-fuchsia-500' },
    { label: 'Total enrollments', value: stats?.total_enrollments || 0, icon: GraduationCap, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Total submissions', value: stats?.total_submissions || 0, icon: Code, tone: 'from-orange-500 to-amber-500' },
    { label: 'Users today', value: stats?.active_users_today || 0, icon: TrendingUp, tone: 'from-sky-500 to-blue-500' },
    { label: 'New users this month', value: stats?.new_users_this_month || 0, icon: Clock, tone: 'from-pink-500 to-rose-500' },
  ]

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-heading">Explore</h1>
          <p className="page-subtitle">Your most common workflows, ready when you are.</p>
        </div>
        {mockMode && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <Activity size={14} /> Mock mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {loading ? '...' : stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`rounded-2xl bg-gradient-to-br ${stat.tone} p-3 text-white shadow-lg shadow-slate-900/10`}>
                <stat.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="card p-5 sm:p-6 lg:col-span-3">
          <h2 className="section-title">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Your most common workflows, ready when you are.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link to="/admin/users" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5">
              <Users className="mb-4 text-blue-600" size={28} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">Explore</span>
                <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={16} />
              </div>
            </Link>
            <Link to="/admin/courses" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5">
              <BookOpen className="mb-4 text-violet-600" size={28} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">Explore</span>
                <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-violet-600" size={16} />
              </div>
            </Link>
          </div>
        </div>

        <div className="card p-5 sm:p-6 lg:col-span-2">
          <h2 className="section-title">Quick actions</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Your most common workflows, ready when you are.</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats?.total_quizzes || 0}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Your most common workflows, ready when you are.</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">Your most common workflows, ready when you are.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
