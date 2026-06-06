import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, CheckCircle } from 'lucide-react'
import { coursesApi } from '@/api/endpoints'
import type { EnrollmentWithCourse } from '@/types'
import { formatDate, cn } from '@/utils'
import { LoadingSpinner } from '@/components/common'

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const response = await coursesApi.getMyCourses()
        setEnrollments(response.items)
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMyCourses()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 mb-4">Bạn chưa đăng ký khóa học nào</p>
          <Link to="/courses" className="btn-primary">
            Khám phá khóa học
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <Link
              key={enrollment.id}
              to={`/courses/${enrollment.course.id}`}
              className="card-hover"
            >
              <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center relative">
                <BookOpen className="text-primary-600" size={48} />
                <span className={cn(
                  'absolute top-3 right-3 badge',
                  enrollment.status === 'completed' && 'badge-success',
                  enrollment.status === 'active' && 'badge-primary',
                  enrollment.status === 'dropped' && 'bg-gray-100 text-gray-800'
                )}>
                  {enrollment.status === 'completed' ? 'Hoàn thành' :
                   enrollment.status === 'active' ? 'Đang học' : 'Đã bỏ'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {enrollment.course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Đăng ký ngày: {formatDate(enrollment.enrolled_at)}
                </p>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tiến độ</span>
                    <span className="font-medium">{enrollment.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
