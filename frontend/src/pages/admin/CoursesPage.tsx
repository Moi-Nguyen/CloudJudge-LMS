import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Eye, Search } from 'lucide-react'
import { coursesApi, getApiErrorMessage } from '@/api/endpoints'
import type { Course } from '@/types'
import { formatDate, cn } from '@/utils'
import { LoadingSpinner } from '@/components/common'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await coursesApi.listCourses({
          page,
          page_size: 20,
          search: search || undefined,
        })
        setCourses(response.items ?? [])
        setTotalPages(response.pages ?? response.total_pages ?? 1)
      } catch (error) {
        console.error('Failed to fetch courses:', error)
        setCourses([])
        setError(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [page, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý khóa học</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm khóa học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          {error}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">Không tìm thấy khóa học nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="card overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <BookOpen className="text-primary-600" size={48} />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h3>
                  <span className={cn(
                    'badge flex-shrink-0',
                    course.is_published ? 'badge-success' : 'badge-warning'
                  )}>
                    {course.is_published ? 'Công khai' : 'Riêng tư'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                  {course.description || 'Không có mô tả'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Tạo: {formatDate(course.created_at)}</span>
                  <div className="flex gap-2">
                    <Link
                      to={`/courses/${course.id}`}
                      className="p-2 rounded-lg hover:bg-gray-100"
                      title="Xem"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline"
          >
            Trước
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-outline"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  )
}
