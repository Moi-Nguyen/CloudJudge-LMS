import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { lessonsApi, quizzesApi } from '@/api/endpoints'

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback

  const detail = error.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(', ')
  }
  return fallback
}

export default function CreateQuizPage() {
  const { courseId, lessonId } = useParams<{ courseId?: string; lessonId?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [quizCourseId, setQuizCourseId] = useState<string | null>(courseId || null)

  useEffect(() => {
    if (courseId) {
      setQuizCourseId(courseId)
      return
    }

    if (!lessonId) return

    const loadLessonCourse = async () => {
      try {
        const lesson = await lessonsApi.getLesson(lessonId)
        setQuizCourseId(lesson.course_id)
      } catch (error) {
        console.error('Failed to load lesson course:', error)
      }
    }

    loadLessonCourse()
  }, [courseId, lessonId])

  // Quiz settings
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined)
  const [maxAttempts, setMaxAttempts] = useState(1)
  const [passingScore, setPassingScore] = useState(60)

  // Questions
  const [questions, setQuestions] = useState<{
    id: string
    question: string
    options: { key: string; value: string }[]
    correct_answer: string
    points: number
  }[]>([])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        question: '',
        options: [
          { key: 'A', value: '' },
          { key: 'B', value: '' },
          { key: 'C', value: '' },
          { key: 'D', value: '' },
        ],
        correct_answer: 'A',
        points: 1,
      },
    ])
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions]
    if (field === 'options') {
      updated[index].options = value
    } else {
      (updated[index] as any)[field] = value
    }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex].value = value
    setQuestions(updated)
  }

  const handleCreateQuiz = async () => {
    if (!lessonId && !quizCourseId) {
      toast.error('Missing course_id or lesson_id to create quiz')
      return
    }
    if (!title.trim()) {
      toast.error('Tiêu đề quiz là bắt buộc')
      return
    }
    if (timeLimit !== undefined && timeLimit <= 0) {
      toast.error('Thời gian làm bài phải lớn hơn 0')
      return
    }
    if (maxAttempts <= 0) {
      toast.error('Số lần làm bài phải lớn hơn 0')
      return
    }
    if (passingScore < 0 || passingScore > 100) {
      toast.error('Điểm qua bài phải từ 0 đến 100')
      return
    }

    setLoading(true)
    try {
      let targetLessonId = lessonId

      if (!targetLessonId && quizCourseId) {
        const lesson = await lessonsApi.createLesson({
          course_id: quizCourseId,
          title: title.trim(),
          description: description.trim() || undefined,
          content: description.trim() || '',
          lesson_type: 'quiz',
        })
        targetLessonId = lesson.id
        setQuizCourseId(lesson.course_id)
      }

      if (!targetLessonId) {
        throw new Error('Missing lesson_id after lesson creation')
      }

      const quiz = await quizzesApi.createQuiz({
        lesson_id: targetLessonId,
        title: title.trim(),
        description: description.trim() || undefined,
        time_limit: timeLimit,
        max_attempts: maxAttempts,
        passing_score: passingScore,
      })
      setQuizId(quiz.id)
      toast.success('Tạo quiz thành công!')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to create quiz:', {
          status: error.response?.status,
          detail: error.response?.data?.detail,
          data: error.response?.data,
        })
      } else {
        console.error('Failed to create quiz:', error)
      }
      toast.error(getApiErrorMessage(error, 'Tạo quiz thất bại'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestions = async () => {
    if (!quizId) return

    setLoading(true)
    try {
      for (const q of questions) {
        await quizzesApi.addQuestion(quizId, {
          question: q.question,
          question_type: 'multiple_choice',
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
        })
      }
      toast.success('Thêm câu hỏi thành công!')
      if (quizCourseId) {
        navigate(`/instructor/edit-course/${quizCourseId}`)
      }
    } catch (error) {
      console.error('Failed to add questions:', error)
      toast.error('Thêm câu hỏi thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo Quiz mới</h1>

        {!quizId ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề quiz
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Nhập tiêu đề quiz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="input"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={timeLimit || ''}
                  onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : undefined)}
                  className="input"
                  placeholder="Không giới hạn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lần làm
                </label>
                <input
                  type="number"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="input"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điểm đạt (%)
                </label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="input"
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <button
              onClick={handleCreateQuiz}
              disabled={loading || !title}
              className="btn-primary"
            >
              {loading ? 'Đang tạo...' : 'Tạo Quiz'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg">
              Quiz đã được tạo! Bây giờ thêm câu hỏi.
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q, qIndex) => (
                <div key={q.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="font-medium">Câu {qIndex + 1}</span>
                    <div className="flex-1">
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                        className="input"
                        placeholder="Nhập câu hỏi"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correct_answer === opt.key}
                          onChange={() => updateQuestion(qIndex, 'correct_answer', opt.key)}
                          className="w-4 h-4 text-primary-600"
                        />
                        <span className="font-medium w-6">{opt.key}.</span>
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          className="input flex-1"
                          placeholder={`Đáp án ${opt.key}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm text-gray-600">Điểm:</label>
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))}
                      className="input w-20"
                      min={1}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addQuestion}
              className="btn-outline"
            >
              <Plus size={16} className="mr-2 inline" />
              Thêm câu hỏi
            </button>

            <button
              onClick={handleAddQuestions}
              disabled={loading || questions.length === 0}
              className="btn-primary"
            >
              {loading ? 'Đang lưu...' : 'Lưu câu hỏi'}
            </button>

            {quizCourseId && (
              <button
                onClick={() => navigate(`/instructor/edit-course/${quizCourseId}`)}
                className="btn-outline ml-2"
              >
                Back to course
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
