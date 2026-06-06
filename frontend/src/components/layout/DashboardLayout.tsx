import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  PlusCircle,
  BarChart3,
  FileQuestion,
  Code,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthStore, useUIStore } from '@/stores'
import { cn, getInitials, getRoleBadgeColor } from '@/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'instructor', 'student'] },
  { name: 'Khóa học', href: '/courses', icon: BookOpen, roles: ['admin', 'instructor', 'student'] },
  { name: 'Khóa học của tôi', href: '/my-courses', icon: GraduationCap, roles: ['student'] },
  { name: 'Tạo khóa học', href: '/instructor/create-course', icon: PlusCircle, roles: ['admin', 'instructor'] },
  { name: 'Quản lý người dùng', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Quản lý khóa học', href: '/admin/courses', icon: Settings, roles: ['admin'] },
  { name: 'Thống kê', href: '/admin', icon: BarChart3, roles: ['admin'] },
]

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNav = navigation.filter((item) =>
    user && item.roles.includes(user.role)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">CloudJudge LMS</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar()
                  }}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                  {user ? getInitials(user.full_name) : 'U'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.full_name}
                  </p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', getRoleBadgeColor(user?.role || 'student'))}>
                    {user?.role === 'admin' ? 'Quản trị' : user?.role === 'instructor' ? 'Giảng viên' : 'Sinh viên'}
                  </span>
                </div>
                <ChevronDown size={16} className={cn('transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={16} />
                    Cài đặt
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
