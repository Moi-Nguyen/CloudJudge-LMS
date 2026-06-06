import { useEffect, useState } from 'react'
import { Users, BookOpen, GraduationCap, Code, TrendingUp, Clock } from 'lucide-react'
import { statsApi } from '@/api/endpoints'
import type { StatsOverview } from '@/types'

export default function AdminDashboardPage() {
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

    fetchStats()
  }, [])

  const statCards = [
    { label: 'Tổng người dùng', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Tổng khóa học', value: stats?.total_courses || 0, icon: BookOpen, color: 'bg-purple-500' },
    { label: 'Tổng đăng ký', value: stats?.total_enrollments || 0, icon: GraduationCap, color: 'bg-green-500' },
    { label: 'Tổng bài nộp', value: stats?.total_submissions || 0, icon: Code, color: 'bg-orange-500' },
    { label: 'Hoạt động hôm nay', value: stats?.active_users_today || 0, icon: TrendingUp, color: 'bg-teal-500' },
    { label: 'Người dùng mới tháng', value: stats?.new_users_this_month || 0, icon: Clock, color: 'bg-pink-500' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển quản trị</h1>

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
                  {loading ? '...' : stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Quản lý</h2>
          <div className="space-y-2">
            <a href="/admin/users" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="inline mr-2 text-blue-500" />
              Quản lý người dùng
            </a>
            <a href="/admin/courses" className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpen className="inline mr-2 text-purple-500" />
              Quản lý khóa học
            </a>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Thống kê nhanh</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Tổng số Quiz</p>
              <p className="text-xl font-bold">{stats?.total_quizzes || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Người dùng hoạt động</p>
              <p className="text-xl font-bold">{stats?.active_users_today || 0} hôm nay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
