import { useState } from 'react'
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
  Sparkles,
} from 'lucide-react'
import { useAuthStore, useUIStore } from '@/stores'
import { cn, getInitials, getRoleBadgeColor } from '@/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'instructor', 'student'] },
  { name: 'Courses', href: '/courses', icon: BookOpen, roles: ['admin', 'instructor', 'student'] },
  { name: 'My courses', href: '/my-courses', icon: GraduationCap, roles: ['student'] },
  { name: 'Create course', href: '/instructor/create-course', icon: PlusCircle, roles: ['admin', 'instructor'] },
  { name: 'Users', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Course admin', href: '/admin/courses', icon: Settings, roles: ['admin'] },
  { name: 'Analytics', href: '/admin', icon: BarChart3, roles: ['admin'] },
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

  const filteredNav = navigation.filter((item) => user && item.roles.includes(user.role))

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef2ff,_transparent_34rem),linear-gradient(180deg,_#f8fafc_0%,_#f1f5f9_100%)] text-slate-900">
      <div className="fixed inset-x-0 top-0 z-30 h-16 border-b border-white/70 bg-white/75 backdrop-blur-xl lg:hidden" />
      <button onClick={toggleSidebar} className="fixed left-4 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden" aria-label="Toggle sidebar">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={toggleSidebar} aria-label="Close sidebar" />}

      <aside className={cn('fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/70 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-primary-500/20"><Sparkles size={21} /></div>
              <div><h1 className="text-base font-bold tracking-tight">CloudJudge LMS</h1><p className="text-xs text-slate-400">Learning operations</p></div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
              return (
                <Link key={item.name} to={item.href} onClick={() => { if (window.innerWidth < 1024) toggleSidebar() }} className={cn('group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200', isActive ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'text-slate-300 hover:bg-white/10 hover:text-white')}>
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-colors', isActive ? 'bg-primary-50 text-primary-700' : 'bg-white/5 text-slate-400 group-hover:text-white')}><item.icon size={18} /></span>
                  <span className="truncate">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-2">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/10">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 text-sm font-bold text-white shadow-lg shadow-primary-500/20">{user ? getInitials(user.full_name) : 'U'}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{user?.full_name}</p><span className={cn('mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px]', getRoleBadgeColor(user?.role || 'student'))}>{user?.role === 'admin' ? 'Admin' : user?.role === 'instructor' ? 'Instructor' : 'Student'}</span></div>
                <ChevronDown size={16} className={cn('text-slate-400 transition-transform', userMenuOpen && 'rotate-180')} />
              </button>
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-950/15">
                  <Link to="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100" onClick={() => setUserMenuOpen(false)}><Settings size={16} />Settings</Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={16} />Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72"><main className="min-h-screen px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main></div>
    </div>
  )
}
