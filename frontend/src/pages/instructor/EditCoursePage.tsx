import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookOpen, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { coursesApi, lessonsApi } from '@/api/endpoints'
import type { Course, Lesson } from '@/types'
import { cn } from '@/utils'
import { LoadingSpinner } from '@/components/common'

export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const data = await coursesApi.getCourse(courseId)
        setCourse(data)
        setTitle(data.title)
        setDescription(data.description || '')

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

  const handleSave = async () => {
    if (!courseId) return

    setSaving(true)
    try {
      await coursesApi.updateCourse(courseId, {
        title,
        description,
      })
      toast.success('Lưu thành công!')
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async () => {
    if (!courseId || !course) return

    try {
      await coursesApi.updateCourse(courseId, {
        is_published: !course.is_published,
      })
      setCourse({ ...course, is_published: !course.is_published })
      toast.success(course.is_published ? 'Đã hủy công khai' : 'Đã công khai khóa học')
    } catch (error) {
      console.error('Failed to toggle publish:', error)
      toast.error('Cập nhật thất bại')
    }
  }

  const handleDelete = async () => {
    if (!courseId) return
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return

    try {
      await coursesApi.deleteCourse(courseId)
      toast.success('Xóa khóa học thành công!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Xóa thất bại')
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
    return <div className="text-center py-12">Không tìm thấy khóa học</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa khóa học</h1>
        <div className="flex gap-2">
          <button
            onClick={handleTogglePublish}
            className={cn(
              'btn',
              course.is_published ? 'btn-outline' : 'btn-primary'
            )}
          >
            {course.is_published ? (
              <>
                <EyeOff size={16} className="mr-2 inline" /> Hủy công khai
              </>
            ) : (
              <>
                <Eye size={16} className="mr-2 inline" /> Công khai
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="btn text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-2 inline" /> Xóa
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Lessons */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Bài học ({lessons.length})</h2>
          <button
            onClick={() => navigate(`/instructor/lesson/${courseId}/new`)}
            className="btn-primary text-sm"
          >
            <Plus size={16} className="mr-2 inline" /> Thêm bài học
          </button>
        </div>

        {lessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có bài học nào</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <BookOpen className="text-gray-400" size={20} />
                <div className="flex-1">
                  <p className="font-medium">{lesson.title}</p>
                  <p className="text-sm text-gray-500">{lesson.lesson_type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
