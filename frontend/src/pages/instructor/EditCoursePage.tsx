import { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { BookOpen, Trash2, Plus, Eye, EyeOff, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { coursesApi, lessonsApi, quizzesApi } from '@/api/endpoints'
import type { Course, Lesson, QuizQuestion } from '@/types'
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

const vi = {
  deleteCourseConfirm: '\u0042\u1ea1\u006e \u0063\u00f3 \u0063\u0068\u1eaf\u0063 \u006d\u0075\u1ed1\u006e \u0078\u00f3\u0061 \u006b\u0068\u00f3\u0061 \u0068\u1ecd\u0063 \u006e\u00e0\u0079? \u0048\u00e0\u006e\u0068 \u0111\u1ed9\u006e\u0067 \u006e\u00e0\u0079 \u006b\u0068\u00f4\u006e\u0067 \u0074\u0068\u1ec3 \u0068\u006f\u00e0\u006e \u0074\u00e1\u0063.',
  savedQuiz: '\u0110\u00e3 \u006c\u01b0\u0075 \u0071\u0075\u0069\u007a',
  question: '\u0043\u00e2\u0075 \u0068\u1ecf\u0069',
  points: '\u0110\u0069\u1ec3\u006d',
  answer: '\u0110\u00e1\u0070 \u00e1\u006e',
  correctAnswer: '\u0110\u00e1\u0070 \u00e1\u006e \u0111\u00fa\u006e\u0067',
  addQuestion: '\u0054\u0068\u00ea\u006d \u0063\u00e2\u0075 \u0068\u1ecf\u0069',
  saveQuiz: '\u004c\u01b0\u0075 \u0071\u0075\u0069\u007a',
  editQuiz: '\u0053\u1eeda \u0071\u0075\u0069\u007a',
}

type QuizEditForm = {
  id: string
  title: string
  description: string
  time_limit: string
  passing_score: string
  max_attempts: string
  questions: QuizQuestion[]
}

const emptyQuizForm: QuizEditForm = {
  id: '',
  title: '',
  description: '',
  time_limit: '',
  passing_score: '60',
  max_attempts: '1',
  questions: [],
}

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
  const [editingQuizLessonId, setEditingQuizLessonId] = useState<string | null>(null)
  const [quizForm, setQuizForm] = useState<QuizEditForm>(emptyQuizForm)
  const [quizSaving, setQuizSaving] = useState(false)

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
    if (!confirm(vi.deleteCourseConfirm)) return

    try {
      await coursesApi.deleteCourse(courseId)
      toast.success('Course deleted')
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error('Delete failed')
    }
  }

  const startEditLesson = async (lesson: Lesson) => {
    if (lesson.lesson_type === 'quiz') {
      setEditingLessonId(null)
      setEditingQuizLessonId(lesson.id)
      try {
        const quiz = await quizzesApi.getQuizByLesson(lesson.id)
        const detail = await quizzesApi.getQuiz(quiz.id)
        setQuizForm({
          id: detail.id,
          title: detail.title,
          description: detail.description || '',
          time_limit: detail.time_limit?.toString() || '',
          passing_score: detail.passing_score.toString(),
          max_attempts: detail.max_attempts.toString(),
          questions: detail.questions || [],
        })
      } catch (error) {
        console.error('Failed to load quiz:', error)
        toast.error('Could not load quiz')
        setEditingQuizLessonId(null)
      }
      return
    }

    setEditingQuizLessonId(null)
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

  const cancelEditQuiz = () => {
    setEditingQuizLessonId(null)
    setQuizForm(emptyQuizForm)
  }

  const updateQuizQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    setQuizForm((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => questionIndex === index ? { ...question, ...updates } : question),
    }))
  }

  const updateQuizOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuizForm((current) => ({
      ...current,
      questions: current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question
        const options = [...(question.options || [])]
        options[optionIndex] = { ...options[optionIndex], value }
        return { ...question, options }
      }),
    }))
  }

  const addQuizQuestion = () => {
    const order = quizForm.questions.length
    setQuizForm((current) => ({
      ...current,
      questions: [...current.questions, {
        id: `new-${Date.now()}`,
        quiz_id: current.id,
        question: '',
        question_type: 'multiple_choice',
        options: [{ key: 'A', value: '' }, { key: 'B', value: '' }, { key: 'C', value: '' }, { key: 'D', value: '' }],
        correct_answer: 'A',
        points: 1,
        order,
      }],
    }))
  }

  const handleSaveQuiz = async () => {
    if (!quizForm.id) return
    setQuizSaving(true)
    try {
      await quizzesApi.updateQuiz(quizForm.id, {
        title: quizForm.title,
        description: quizForm.description,
        time_limit: quizForm.time_limit ? Number(quizForm.time_limit) : undefined,
        passing_score: Number(quizForm.passing_score),
        max_attempts: Number(quizForm.max_attempts),
      })
      for (const question of quizForm.questions) {
        const data = {
          question: question.question,
          question_type: question.question_type,
          options: question.options,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          points: question.points,
          order: question.order,
        }
        if (question.id.startsWith('new-')) await quizzesApi.addQuestion(quizForm.id, data)
        else await quizzesApi.updateQuestion(question.id, data)
      }
      toast.success(vi.savedQuiz)
      cancelEditQuiz()
    } catch (error) {
      console.error('Failed to save quiz:', error)
      toast.error('Could not save quiz')
    } finally {
      setQuizSaving(false)
    }
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
                {editingQuizLessonId === lesson.id ? (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Tên quiz
                        <input type="text" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} className="input mt-1" placeholder="Nhập tên quiz" />
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Thời gian làm bài (phút)
                        <input type="number" min={1} value={quizForm.time_limit} onChange={(e) => setQuizForm({ ...quizForm, time_limit: e.target.value })} className="input mt-1" placeholder="Thời gian làm bài" />
                        <span className="mt-1 block text-xs font-normal text-gray-500">Thời gian tính bằng phút</span>
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Điểm đạt (%)
                        <input type="number" min={0} max={100} value={quizForm.passing_score} onChange={(e) => setQuizForm({ ...quizForm, passing_score: e.target.value })} className="input mt-1" placeholder="Điểm đạt" />
                        <span className="mt-1 block text-xs font-normal text-gray-500">Điểm đạt từ 0 đến 100</span>
                      </label>
                      <label className="block text-sm font-medium text-gray-700">
                        Số lần làm tối đa
                        <input type="number" min={1} value={quizForm.max_attempts} onChange={(e) => setQuizForm({ ...quizForm, max_attempts: e.target.value })} className="input mt-1" placeholder="Số lần làm tối đa" />
                        <span className="mt-1 block text-xs font-normal text-gray-500">Số lần làm tối đa phải lớn hơn hoặc bằng 1</span>
                      </label>
                    </div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mô tả quiz
                      <textarea value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} rows={2} className="input mt-1" placeholder="Nhập mô tả quiz" />
                    </label>
                    <div className="space-y-3">
                      {quizForm.questions.map((question, questionIndex) => (
                        <div key={question.id} className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                            <label className="block text-sm font-medium text-gray-700">
                              Câu hỏi
                              <input type="text" value={question.question} onChange={(e) => updateQuizQuestion(questionIndex, { question: e.target.value })} className="input mt-1" placeholder="Nhập nội dung câu hỏi" />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                              Điểm câu hỏi
                              <input type="number" min={1} value={question.points} onChange={(e) => updateQuizQuestion(questionIndex, { points: Number(e.target.value) })} className="input mt-1" placeholder={vi.points} />
                            </label>
                          </div>
                          <p className="mt-3 text-sm font-medium text-gray-700">Đáp án đúng</p>
                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            {(question.options || []).map((option, optionIndex) => (
                              <label key={option.key} className="block text-sm font-medium text-gray-700">
                                Đáp án {option.key}
                                <div className="mt-1 flex items-center gap-2">
                                  <input type="radio" name={`correct-${question.id}`} checked={question.correct_answer === option.key} onChange={() => updateQuizQuestion(questionIndex, { correct_answer: option.key })} aria-label={`Đáp án đúng ${option.key}`} />
                                  <input type="text" value={option.value} onChange={(e) => updateQuizOption(questionIndex, optionIndex, e.target.value)} className="input" placeholder={`Nhập đáp án ${option.key}`} />
                                </div>
                              </label>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-gray-500">Đáp án đúng hiện tại: {question.correct_answer}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={addQuizQuestion} className="btn-outline text-sm">{vi.addQuestion}</button>
                      <button onClick={handleSaveQuiz} disabled={quizSaving} className="btn-primary text-sm">{quizSaving ? 'Saving...' : vi.saveQuiz}</button>
                      <button onClick={cancelEditQuiz} className="btn-outline text-sm">Cancel</button>
                    </div>
                  </div>
                ) : editingLessonId === lesson.id ? (
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
                      <Pencil size={14} className="mr-1 inline" /> {lesson.lesson_type === 'quiz' ? vi.editQuiz : 'Edit'}
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
