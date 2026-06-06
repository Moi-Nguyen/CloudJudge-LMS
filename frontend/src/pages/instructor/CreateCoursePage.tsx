import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { coursesApi } from '@/api/endpoints'

const createCourseSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  description: z.string().optional(),
})

type CreateCourseForm = z.infer<typeof createCourseSchema>

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
  })

  const onSubmit = async (data: CreateCourseForm) => {
    setLoading(true)
    try {
      const course = await coursesApi.createCourse({
        title: data.title,
        description: data.description,
      })
      toast.success('Tạo khóa học thành công!')
      navigate(`/instructor/edit-course/${course.id}`)
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error('Tạo khóa học thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo khóa học mới</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề khóa học
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Nhập tiêu đề khóa học"
              className="input"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Mô tả khóa học (tùy chọn)"
              className="input"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Đang tạo...' : 'Tạo khóa học'}
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
