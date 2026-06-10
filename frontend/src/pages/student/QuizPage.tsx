import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import { quizzesApi } from '@/api/endpoints'
import type { Quiz, QuizAttempt } from '@/types'
import { cn } from '@/utils'
import { LoadingSpinner } from '@/components/common'

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const [quiz, setQuiz] = useState<(Quiz & { questions: any[] }) | null>(null)
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return

      try {
        const data = await quizzesApi.getQuizForStudent(quizId)
        setQuiz(data)

        // Get previous attempts
        const attempts = await quizzesApi.getAttempts(quizId)
        if (attempts.items.length > 0) {
          setAttempt(attempts.items[0])
        }
      } catch (error) {
        console.error('Failed to fetch quiz:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [quizId])

  const handleStartAttempt = async () => {
    if (!quizId) return

    try {
      const newAttempt = await quizzesApi.startAttempt(quizId)
      setAttempt(newAttempt)
      if (quiz?.time_limit) {
        setTimeLeft(quiz.time_limit * 60)
      }
    } catch (error) {
      console.error('Failed to start attempt:', error)
    }
  }

  const handleSubmit = async () => {
    if (!quizId || !attempt) return

    setSubmitting(true)
    try {
      const submission = {
        answers: Object.entries(answers).map(([question_id, selected_answer]) => ({
          question_id,
          selected_answer,
        })),
      }

      const result = await quizzesApi.submitQuiz(quizId, attempt.id, submission)
      setAttempt(result.attempt)
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!quiz) {
    return <div className="text-center py-12">Không tìm thấy quiz</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-gray-600 mb-4">{quiz.description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
          <span>{quiz.questions.length} câu hỏi</span>
          {quiz.time_limit && <span>Thời gian: {quiz.time_limit} phút</span>}
          <span>Điểm đạt: {quiz.passing_score}%</span>
          <span>Tối đa: {quiz.max_attempts} lần</span>
        </div>
      </div>

      {!attempt || attempt.submitted_at ? (
        <div className="card p-6 text-center">
          {attempt?.submitted_at ? (
            <div className="mb-4">
              <div className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                attempt.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              )}>
                {attempt.passed ? <CheckCircle size={20} /> : <XCircle size={20} />}
                {attempt.passed ? 'Đạt' : 'Không đạt'}
              </div>
              <p className="mt-4 text-lg">
                Điểm: <span className="font-bold">{attempt.score}/{attempt.total_points}</span>
                ({attempt.percentage}%)
              </p>
            </div>
          ) : null}

          <button onClick={handleStartAttempt} className="btn-primary">
            {attempt ? 'Làm lại' : 'Bắt đầu làm quiz'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timer */}
          {timeLeft !== null && (
            <div className="card p-4 flex items-center justify-between">
              <span className="text-gray-600">Thời gian còn lại:</span>
              <span className={cn(
                'text-2xl font-mono font-bold',
                timeLeft < 60 ? 'text-red-600' : 'text-gray-900'
              )}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Questions */}
          {quiz.questions.map((question, index) => (
            <div key={question.id} className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                  <p className="text-sm text-gray-500 mb-4">({question.points} điểm)</p>

                  {question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: any) => (
                        <label
                          key={option.key}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                            answers[question.id] === option.key
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          )}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={option.key}
                            checked={answers[question.id] === option.key}
                            onChange={(e) => setAnswers({
                              ...answers,
                              [question.id]: e.target.value,
                            })}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span>{option.value}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length !== quiz.questions.length}
            className="btn-primary w-full py-3"
          >
            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
          </button>
        </div>
      )}
    </div>
  )
}
