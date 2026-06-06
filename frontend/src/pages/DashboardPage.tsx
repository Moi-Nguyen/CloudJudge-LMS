import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, BookOpen, GraduationCap, Code, TrendingUp, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores'
import { statsApi, coursesApi, problemsApi } from '@/api/endpoints'
import type { StatsOverview } from '@/types'
import { formatDate } from '@/utils'

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
    { label: 'Tổng người dùng', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Tổng khóa học', value: stats?.total_courses || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Tổng đăng ký', value: stats?.total_enrollments || 0, icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Tổng bài nộp', value: stats?.total_submissions || 0, icon: Code, color: 'bg-orange-500' },
    { label: 'Người dùng hôm nay', value: stats?.active_users_today || 0, icon: TrendingUp, color: 'bg-teal-500' },
    { label: 'Người dùng mới tháng', value: stats?.new_users_this_month || 0, icon: Clock, color: 'bg-pink-500' },
  ] : [
    { label: 'Khóa học đã tham gia', value: '-', icon: GraduationCap, color: 'bg-blue-500' },
    { label: 'Bài quiz đã làm', value: '-', icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Bài lập trình đã nộp', value: '-', icon: Code, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Chào mừng, {user?.full_name}!
        </h1>
        <p className="opacity-90">
          {user?.role === 'admin'
            ? 'Đây là trang quản trị hệ thống CloudJudge LMS'
            : user?.role === 'instructor'
            ? 'Quản lý khóa học và bài tập của bạn'
            : 'Tiếp tục học tập và phát triển kỹ năng lập trình'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Hành động nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/courses"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <BookOpen className="text-primary-600" size={32} />
            <span className="text-sm font-medium">Khám phá khóa học</span>
          </Link>
          {user?.role !== 'student' && (
            <Link
              to="/instructor/create-course"
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <GraduationCap className="text-secondary-600" size={32} />
              <span className="text-sm font-medium">Tạo khóa học mới</span>
            </Link>
          )}
          <Link
            to="/my-courses"
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Code className="text-green-600" size={32} />
            <span className="text-sm font-medium">Khóa học của tôi</span>
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin/users"
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <Users className="text-orange-600" size={32} />
              <span className="text-sm font-medium">Quản lý người dùng</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
