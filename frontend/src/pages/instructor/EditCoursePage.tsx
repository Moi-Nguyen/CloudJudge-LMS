import { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { BookOpen, Trash2, Plus, Eye, EyeOff, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { coursesApi, lessonsApi } from '@/api/endpoints'
import type { Course, Lesson } from '@/types'
import { cn } from '@/utils'
import { LoadingSpinner } from '@/components/common'

type LessonForm = {
  title: string
  description: string
  content: string
  lesson_type: Lesson['lesson_type']
  file_url: string
  file_name: string
  file_type: string
  external_url: string
  storage_provider: 'local' | 'external' | 'supabase'
}

const lessonTypes: Lesson['lesson_type'][] = ['video', 'document', 'quiz', 'programming']

export default function EditCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [lessonSaving, setLessonSaving] = useState(false)
  const emptyLessonForm: LessonForm = {
    title: '',
    description: '',
    content: '',
    lesson_type: 'document',
    file_url: '',
    file_name: '',
    file_type: '',
    external_url: '',
    storage_provider: 'local',
  }
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLessonForm)

  const loadLessons = async () => {
    if (!courseId) return
    const lessonsData = await lessonsApi.getCourseLessons(courseId)
    setLessons(lessonsData.items ?? lessonsData.lessons ?? [])
  }

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      try {
        const data = await coursesApi.getCourse(courseId)
        setCourse(data)
        setTitle(data.title)
        setDescription(data.description || '')
        await loadLessons()
      } catch (error) {
        console.error('Failed to fetch course:', error)
        toast.error('Could not load course')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId, location.key])

  const handleSave = async () => {
    if (!courseId) return

    setSaving(true)
    try {
      await coursesApi.updateCourse(courseId, {
        title,
        description,
      })
      toast.success('Course saved')
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Save failed')
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
      toast.success(course.is_published ? 'Course unpublished' : 'Course published')
    } catch (error) {
      console.error('Failed to toggle publish:', error)
      toast.error('Update failed')
    }
  }

  const handleDelete = async () => {
    if (!courseId) return
    if (!confirm('Delete this course?')) return

    try {
      await coursesApi.deleteCourse(courseId)
      toast.success('Course deleted')
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Delete failed')
    }
  }

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || '',
      lesson_type: lesson.lesson_type,
      file_url: lesson.file_url || '',
      file_name: lesson.file_name || '',
      file_type: lesson.file_type || '',
      external_url: lesson.external_url || '',
      storage_provider: lesson.storage_provider || 'local',
    })
  }

  const cancelEditLesson = () => {
    setEditingLessonId(null)
    setLessonForm(emptyLessonForm)
  }

  const handleSaveLesson = async (lessonId: string) => {
    setLessonSaving(true)
    try {
      const metadata = lessonForm.lesson_type === 'document' || lessonForm.lesson_type === 'video'
        ? {
            file_url: lessonForm.file_url || undefined,
            file_name: lessonForm.file_name || undefined,
            file_type: lessonForm.file_type || undefined,
            external_url: lessonForm.external_url || undefined,
            storage_provider: lessonForm.storage_provider,
          }
        : {}
      const updatedLesson = await lessonsApi.updateLesson(lessonId, {
        title: lessonForm.title,
        description: lessonForm.description,
        content: lessonForm.content,
        lesson_type: lessonForm.lesson_type,
        ...metadata,
      })
      setLessons((current) => current.map((lesson) => lesson.id === lessonId ? updatedLesson : lesson))
      cancelEditLesson()
      toast.success('Lesson saved')
    } catch (error) {
      console.error('Failed to update lesson:', error)
      toast.error('Could not save lesson')
    } finally {
      setLessonSaving(false)
    }
  }

  const handleToggleLessonPublish = async (lesson: Lesson) => {
    try {
      const updatedLesson = await lessonsApi.updateLesson(lesson.id, {
        is_published: !lesson.is_published,
      })
      setLessons((current) => current.map((item) => item.id === lesson.id ? updatedLesson : item))
      toast.success(updatedLesson.is_published ? 'Lesson published' : 'Lesson unpublished')
    } catch (error) {
      console.error('Failed to update lesson status:', error)
      toast.error('Could not update lesson status')
    }
  }

  const handleDeleteLesson = async (lesson: Lesson) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return

    try {
      await lessonsApi.deleteLesson(lesson.id)
      setLessons((current) => current.filter((item) => item.id !== lesson.id))
      if (editingLessonId === lesson.id) cancelEditLesson()
      toast.success('Lesson deleted')
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      toast.error('Could not delete lesson')
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
    return <div className="text-center py-12">Course not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit course</h1>
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
                <EyeOff size={16} className="mr-2 inline" /> Unpublish
              </>
            ) : (
              <>
                <Eye size={16} className="mr-2 inline" /> Publish
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="btn text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-2 inline" /> Delete
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
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
              Description
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
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Lessons ({lessons.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/instructor/course/${courseId}/quiz/new`)}
              className="btn-outline text-sm"
            >
              <Plus size={16} className="mr-2 inline" /> Add Quiz
            </button>
            <button
              onClick={() => navigate(`/instructor/lesson/${courseId}/new`)}
              className="btn-primary text-sm"
            >
              <Plus size={16} className="mr-2 inline" /> Add lesson
            </button>
          </div>
        </div>

        {lessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No lessons yet</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                {editingLessonId === lesson.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        value={lessonForm.title}
                        onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                        className="input"
                        placeholder="Lesson title"
                      />
                      <select
                        value={lessonForm.lesson_type}
                        onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value as Lesson['lesson_type'] })}
                        className="input"
                      >
                        {lessonTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                      rows={2}
                      className="input"
                      placeholder="Description"
                    />
                    <textarea
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      rows={3}
                      className="input"
                      placeholder="Content"
                    />
                    {(lessonForm.lesson_type === 'document' || lessonForm.lesson_type === 'video') && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="url"
                          value={lessonForm.file_url}
                          onChange={(e) => setLessonForm({ ...lessonForm, file_url: e.target.value })}
                          className="input"
                          placeholder="Direct file URL"
                        />
                        <input
                          type="url"
                          value={lessonForm.external_url}
                          onChange={(e) => setLessonForm({ ...lessonForm, external_url: e.target.value })}
                          className="input"
                          placeholder="External URL"
                        />
                        <input
                          type="text"
                          value={lessonForm.file_name}
                          onChange={(e) => setLessonForm({ ...lessonForm, file_name: e.target.value })}
                          className="input"
                          placeholder="File name"
                        />
                        <input
                          type="text"
                          value={lessonForm.file_type}
                          onChange={(e) => setLessonForm({ ...lessonForm, file_type: e.target.value })}
                          className="input"
                          placeholder="File type, e.g. application/pdf or video/mp4"
                        />
                        <select
                          value={lessonForm.storage_provider}
                          onChange={(e) => setLessonForm({ ...lessonForm, storage_provider: e.target.value as LessonForm['storage_provider'] })}
                          className="input"
                        >
                          <option value="local">local</option>
                          <option value="external">external</option>
                          <option value="supabase">supabase</option>
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveLesson(lesson.id)}
                        disabled={lessonSaving}
                        className="btn-primary text-sm"
                      >
                        {lessonSaving ? 'Saving...' : 'Save lesson'}
                      </button>
                      <button onClick={cancelEditLesson} className="btn-outline text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <BookOpen className="text-gray-400" size={20} />
                    <div className="flex-1">
                      <p className="font-medium">{lesson.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500">{lesson.lesson_type}</span>
                        <span className={cn('badge', lesson.is_published ? 'badge-success' : 'bg-yellow-100 text-yellow-800')}>
                          {lesson.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleLessonPublish(lesson)}
                      className={cn('btn-outline text-sm', lesson.is_published && 'text-yellow-700')}
                    >
                      {lesson.is_published ? <EyeOff size={14} className="mr-1 inline" /> : <Eye size={14} className="mr-1 inline" />}
                      {lesson.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => startEditLesson(lesson)}
                      className="btn-outline text-sm"
                    >
                      <Pencil size={14} className="mr-1 inline" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLesson(lesson)}
                      className="btn text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="mr-1 inline" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
