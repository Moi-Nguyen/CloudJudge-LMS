import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play, Send, CheckCircle, XCircle, Clock, MemoryStick } from 'lucide-react'
import toast from 'react-hot-toast'
import { problemsApi } from '@/api/endpoints'
import type { Problem, Submission } from '@/types'
import { cn, formatDateTime } from '@/utils'
import { LoadingSpinner } from '@/components/common'

const languageOptions = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
]

export default function ProgrammingPage() {
  const { problemId } = useParams<{ problemId: string }>()
  const [problem, setProblem] = useState<(Problem & { test_cases: any[] }) | null>(null)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    const fetchProblem = async () => {
      if (!problemId) return

      try {
        const data = await problemsApi.getProblem(problemId)
        setProblem(data)
        setCode(data.starter_code || '# Write your code here\n')
      } catch (error) {
        console.error('Failed to fetch problem:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProblem()
  }, [problemId])

  const handleSubmit = async () => {
    if (!problemId) return

    setSubmitting(true)
    try {
      const result = await problemsApi.submitSolution({
        problem_id: problemId,
        code,
        language,
      })
      setSubmission(result)
      toast.success('Nộp bài thành công!')
    } catch (error) {
      console.error('Failed to submit:', error)
      toast.error('Nộp bài thất bại')
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

  if (!problem) {
    return <div className="text-center py-12">Không tìm thấy bài tập</div>
  }

  const sampleTestCases = problem.test_cases?.filter((tc: any) => tc.is_sample) || []

  return (
    <div className="space-y-6">
      {/* Problem Description */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
          <span className={cn(
            'badge',
            problem.difficulty === 'easy' && 'badge-success',
            problem.difficulty === 'medium' && 'badge-warning',
            problem.difficulty === 'hard' && 'badge-danger'
          )}>
            {problem.difficulty === 'easy' ? 'Dễ' :
             problem.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={14} /> {problem.time_limit}ms
          </span>
          <span className="flex items-center gap-1">
            <MemoryStick size={14} /> {problem.memory_limit}MB
          </span>
        </div>

        <div className="prose max-w-none">
          <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
        </div>
      </div>

      {/* Sample Test Cases */}
      {sampleTestCases.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Ví dụ</h3>
          <div className="space-y-4">
            {sampleTestCases.map((tc: any, index: number) => (
              <div key={tc.id} className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Input:</p>
                    <pre className="bg-gray-100 rounded p-2 text-sm font-mono">
                      {tc.input}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Output:</p>
                    <pre className="bg-gray-100 rounded p-2 text-sm font-mono">
                      {tc.expected_output}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Editor */}
      <div className="card overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-sm bg-transparent border-none focus:outline-none"
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary text-sm flex items-center gap-2"
          >
            <Send size={14} />
            {submitting ? 'Đang chấm...' : 'Nộp bài'}
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none"
          spellCheck={false}
        />
      </div>

      {/* Submission Result */}
      {submission && (
        <div className={cn(
          'card p-6',
          submission.status === 'accepted' ? 'border-green-500' : 'border-red-500'
        )}>
          <div className="flex items-center gap-3 mb-4">
            {submission.status === 'accepted' ? (
              <CheckCircle className="text-green-500" size={24} />
            ) : (
              <XCircle className="text-red-500" size={24} />
            )}
            <span className="font-semibold">
              {submission.status === 'accepted' ? 'Đạt!' : 'Không đạt'}
            </span>
            <span className="text-gray-500">
              Điểm: {submission.score}/{submission.total_points}
            </span>
          </div>

          {submission.status !== 'accepted' && submission.error_message && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {submission.error_message}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4">
            Nộp lúc: {formatDateTime(submission.submitted_at)}
          </p>
        </div>
      )}
    </div>
  )
}
