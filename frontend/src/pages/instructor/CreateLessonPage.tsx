import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Video, FileText, Code, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiErrorMessage, lessonsApi } from '@/api/endpoints'
import { cn } from '@/utils'

const lessonTypes = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'document', label: 'Tài liệu', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'programming', label: 'Lập trình', icon: Code },
]

const createLessonSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  description: z.string().optional(),
  content: z.string().trim().min(1, 'Lesson content is required'),
  lesson_type: z.enum(['video', 'document', 'quiz', 'programming']),
  duration_minutes: z.number().optional(),
})

type CreateLessonForm = z.infer<typeof createLessonSchema>

export default function CreateLessonPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateLessonForm>({
    resolver: zodResolver(createLessonSchema),
    defaultValues: {
      lesson_type: 'video',
    },
  })

  const selectedType = watch('lesson_type')

  const onSubmit = async (data: CreateLessonForm) => {
    if (!courseId) {
      toast.error('Could not find the course for this lesson.')
      return
    }

    setLoading(true)
    try {
      const lesson = await lessonsApi.createLesson({
        course_id: courseId,
        title: data.title,
        description: data.description,
        content: data.content || '',
        lesson_type: data.lesson_type,
        duration_minutes: data.duration_minutes,
      })

      toast.success('Tạo bài học thành công!')

      // Redirect based on lesson type
      if (data.lesson_type === 'quiz') {
        navigate(`/instructor/quiz/${lesson.id}/new`)
      } else if (data.lesson_type === 'programming') {
        navigate(`/instructor/problem/${lesson.id}/new`)
      } else {
        navigate(`/instructor/edit-course/${courseId}`)
      }
    } catch (error) {
      console.error('Failed to create lesson:', error)

      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response
        if (response?.status === 403) {
          toast.error('You do not have permission to create lessons for this course.')
        } else if (response?.status === 422) {
          console.error('Create lesson validation detail:', response.data?.detail)
          toast.error('Lesson data is invalid. Please check title, content, and lesson type.')
        } else {
          toast.error(getApiErrorMessage(error))
        }
      } else {
        toast.error('Could not create lesson')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Thêm bài học mới</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Lesson Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Loại bài học
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {lessonTypes.map((type) => {
                const Icon = type.icon
                return (
                  <label
                    key={type.value}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                      selectedType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register('lesson_type')}
                      className="sr-only"
                    />
                    <Icon
                      size={24}
                      className={cn(
                        selectedType === type.value ? 'text-primary-600' : 'text-gray-400'
                      )}
                    />
                    <span className="text-sm font-medium">{type.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề bài học
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Nhập tiêu đề bài học"
              className="input"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Mô tả ngắn về bài học (tùy chọn)"
              className="input"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung
            </label>
            <textarea
              {...register('content')}
              rows={6}
              placeholder="Nội dung bài học"
              className="input"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời lượng (phút)
            </label>
            <input
              {...register('duration_minutes', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="Thời lượng ước tính"
              className="input w-32"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Đang tạo...' : 'Tạo bài học'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-outline"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
