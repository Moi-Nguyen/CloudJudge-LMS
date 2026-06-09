import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react'
import { coursesApi } from '@/api/endpoints'

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
})

type CreateCourseForm = z.infer<typeof createCourseSchema>

export default function CreateCoursePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<CreateCourseForm>({ resolver: zodResolver(createCourseSchema) })

  const onSubmit = async (data: CreateCourseForm) => {
    setLoading(true)
    try {
      const course = await coursesApi.createCourse({ title: data.title, description: data.description })
      toast.success('Course created successfully!')
      navigate(`/instructor/edit-course/${course.id}`)
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error('Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell max-w-5xl">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost w-fit"><ArrowLeft size={16} />Back</button>
      <div className="grid gap-6 lg:grid-cols-5">
        <aside className="card bg-slate-950 p-6 text-white lg:col-span-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950"><BookOpen size={24} /></div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Create new course</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Start with a clear title and short description. You can add lessons, quizzes, and programming tasks next.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-300"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={18} />Content can be edited later</div><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-400" size={18} />Mock mode stays unchanged</div></div>
        </aside>
        <section className="card p-5 sm:p-8 lg:col-span-3">
          <div className="mb-6"><h2 className="section-title">Basic information</h2><p className="mt-1 text-sm text-slate-500">Enter the information students see while exploring courses.</p></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Course title</label><input {...register('title')} type="text" placeholder="Example: Python programming basics" className="input" />{errors.title && <p className="mt-2 text-sm font-medium text-red-600">{errors.title.message}</p>}</div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Description</label><textarea {...register('description')} rows={6} placeholder="Summarize goals, audience, and course outcomes..." className="input resize-none" /></div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button><button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create course'}</button></div>
          </form>
        </section>
      </div>
    </div>
  )
}
