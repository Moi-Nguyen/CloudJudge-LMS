import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, Users, Play, FileText, Code, Edit, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { coursesApi, lessonsApi } from '@/api/endpoints'
import { useAuthStore } from '@/stores'
import type { CourseDetail, Lesson } from '@/types'
import { formatDate, cn } from '@/utils'
import { LoadingSpinner } from '@/components/common'

const lessonTypeIcons = {
  video: Play,
  document: FileText,
  quiz: BookOpen,
  programming: Code,
}

const lessonTypeLabels = {
  video: 'Video',
  document: 'Tài liệu',
  quiz: 'Quiz',
  programming: 'Lập trình',
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  const isOwner = user?.id === course?.instructor_id
  const isAdmin = user?.role === 'admin'
  const canManage = isOwner || isAdmin

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      setLoading(true)
      try {
        const courseData = await coursesApi.getCourse(courseId)
        setCourse(courseData)

        const lessonsData = await lessonsApi.getCourseLessons(courseId)
        setLessons(lessonsData.items)
      } catch (error) {
        console.error('Failed to fetch course:', error)
        toast.error('Không thể tải thông tin khóa học')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleEnroll = async () => {
    if (!courseId) return

    setEnrolling(true)
    try {
      await coursesApi.enrollInCourse(courseId)
      toast.success('Đăng ký khóa học thành công!')
      const updatedCourse = await coursesApi.getCourse(courseId)
      setCourse(updatedCourse)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Đăng ký thất bại'
      toast.error(message)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy khóa học</p>
        <Link to="/courses" className="text-primary-600 hover:underline mt-4 inline-block">
          Quay lại danh sách khóa học
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
          <BookOpen className="text-primary-600" size={80} />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">
                Giảng viên: <span className="font-medium">{course.instructor.full_name}</span>
              </p>
              <p className="text-gray-500">{course.description || 'Không có mô tả'}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {lessons.length} bài học
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {course.student_count} học viên
                </span>
              </div>
              {canManage ? (
                <Link
                  to={`/instructor/edit-course/${course.id}`}
                  className="btn-outline"
                >
                  <Edit size={16} className="mr-2 inline" />
                  Chỉnh sửa
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary"
                >
                  {enrolling ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Nội dung khóa học</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có bài học nào</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, index) => {
              const Icon = lessonTypeIcons[lesson.lesson_type]
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    <p className="text-sm text-gray-500">{lesson.description}</p>
                  </div>
                  <span className={cn(
                    'badge',
                    lesson.lesson_type === 'video' && 'badge-primary',
                    lesson.lesson_type === 'quiz' && 'badge-success',
                    lesson.lesson_type === 'programming' && 'badge-warning',
                    lesson.lesson_type === 'document' && 'bg-gray-100 text-gray-800'
                  )}>
                    {lessonTypeLabels[lesson.lesson_type]}
                  </span>
                  <Link
                    to={lesson.lesson_type === 'quiz'
                      ? `/quiz/${lesson.id}`
                      : `/problem/${lesson.id}`}
                    className="btn-ghost text-sm"
                  >
                    {lesson.lesson_type === 'quiz' ? 'Làm quiz' : 'Xem'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {canManage && (
          <div className="mt-6 pt-6 border-t">
            <Link
              to={`/instructor/lesson/${course.id}/new`}
              className="btn-primary"
            >
              Thêm bài học
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
