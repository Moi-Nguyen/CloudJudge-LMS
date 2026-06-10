import { useEffect, useState } from 'react'
import { Search, Ban, CheckCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi } from '@/api/endpoints'
import type { User } from '@/types'
import { formatDate, cn, getRoleBadgeColor } from '@/utils'
import { LoadingSpinner } from '@/components/common'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await usersApi.listUsers({
          page,
          page_size: 20,
          search: search || undefined,
          role: roleFilter || undefined,
        })
        setUsers(response.items)
        setTotalPages(response.total_pages)
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [page, search, roleFilter])

  const handleToggleActive = async (userId: string) => {
    try {
      const updated = await usersApi.toggleUserActive(userId)
      setUsers(users.map(u => u.id === userId ? updated : u))
      toast.success(updated.is_active ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản')
    } catch (error) {
      toast.error('Cập nhật thất bại')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return

    try {
      await usersApi.deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
      toast.success('Xóa người dùng thành công')
    } catch (error) {
      toast.error('Xóa thất bại')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="instructor">Giảng viên</option>
          <option value="student">Sinh viên</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Người dùng</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Vai trò</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <LoadingSpinner size="lg" className="mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Không tìm thấy người dùng
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', getRoleBadgeColor(user.role))}>
                        {user.role === 'admin' ? 'Admin' :
                         user.role === 'instructor' ? 'Giảng viên' : 'Sinh viên'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'badge',
                        user.is_active ? 'badge-success' : 'badge-danger'
                      )}>
                        {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={cn(
                            'p-2 rounded-lg',
                            user.is_active
                              ? 'text-yellow-600 hover:bg-yellow-50'
                              : 'text-green-600 hover:bg-green-50'
                          )}
                          title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {user.is_active ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Trang {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline text-sm"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline text-sm"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
