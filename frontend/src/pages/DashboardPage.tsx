import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookOpen, Users, GraduationCap, Code, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { statsApi } from '@/api/endpoints'
import type { StatsOverview } from '@/types'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statsApi.getOverview()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.role === 'admin') {
      fetchStats()
    } else {
      setLoading(false)
    }
  }, [user?.role])

  const statCards = user?.role === 'admin' ? [
    { label: 'Total users', value: stats?.total_users || 0, icon: Users, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Total courses', value: stats?.total_courses || 0, icon: BookOpen, tone: 'from-violet-500 to-fuchsia-500' },
    { label: 'Total enrollments', value: stats?.total_enrollments || 0, icon: GraduationCap, tone: 'from-emerald-500 to-teal-500' },
    { label: 'Total submissions', value: stats?.total_submissions || 0, icon: Code, tone: 'from-orange-500 to-amber-500' },
    { label: 'Users today', value: stats?.active_users_today || 0, icon: TrendingUp, tone: 'from-sky-500 to-blue-500' },
    { label: 'New users this month', value: stats?.new_users_this_month || 0, icon: Clock, tone: 'from-pink-500 to-rose-500' },
  ] : [
    { label: 'Joined courses', value: '-', icon: GraduationCap, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Completed quizzes', value: '-', icon: BookOpen, tone: 'from-violet-500 to-fuchsia-500' },
    { label: 'Programming submissions', value: '-', icon: Code, tone: 'from-emerald-500 to-teal-500' },
  ]

  return (
    <div className="page-shell">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 sm:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-16 h-40 w-40 rounded-full bg-secondary-500/20 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">CloudJudge workspace</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome, {user?.full_name}!
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            {user?.role === 'admin'
              ? 'Track system activity, courses, and users in one polished workspace.'
              : user?.role === 'instructor'
              ? 'Create content, manage assignments, and keep learning organized.'
              : 'Continue learning, practicing quizzes, and improving skills.'}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`rounded-2xl bg-gradient-to-br ${stat.tone} p-3 text-white shadow-lg shadow-slate-900/10`}>
                <stat.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">Your most common workflows, ready when you are.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Link to="/courses" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5">
            <BookOpen className="mb-4 text-primary-600" size={28} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">Explore</span>
              <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-primary-600" size={16} />
            </div>
          </Link>
          {user?.role !== 'student' && (
            <Link to="/instructor/create-course" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5">
              <GraduationCap className="mb-4 text-secondary-600" size={28} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">Explore</span>
                <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-secondary-600" size={16} />
              </div>
            </Link>
          )}
          <Link to="/my-courses" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5">
            <Code className="mb-4 text-emerald-600" size={28} />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-900">Explore</span>
              <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600" size={16} />
            </div>
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin/users" className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5">
              <Users className="mb-4 text-orange-600" size={28} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900">Explore</span>
                <ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600" size={16} />
              </div>
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
