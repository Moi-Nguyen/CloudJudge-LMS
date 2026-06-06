import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { problemsApi } from '@/api/endpoints'

export default function CreateProblemPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [problemId, setProblemId] = useState<string | null>(null)

  // Problem settings
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [starterCode, setStarterCode] = useState('# Write your code here\n')
  const [language, setLanguage] = useState('python')
  const [timeLimit, setTimeLimit] = useState(2000)
  const [memoryLimit, setMemoryLimit] = useState(256)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  // Test cases
  const [testCases, setTestCases] = useState<{
    id: string
    input: string
    expected_output: string
    is_sample: boolean
    points: number
  }[]>([])

  const addTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: Date.now().toString(),
        input: '',
        expected_output: '',
        is_sample: testCases.length === 0,
        points: 10,
      },
    ])
  }

  const updateTestCase = (index: number, field: string, value: any) => {
    const updated = [...testCases]
    ;(updated[index] as any)[field] = value
    setTestCases(updated)
  }

  const removeTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index))
  }

  const handleCreateProblem = async () => {
    if (!lessonId) return

    setLoading(true)
    try {
      const problem = await problemsApi.createProblem({
        lesson_id: lessonId,
        title,
        description,
        starter_code: starterCode,
        language,
        time_limit: timeLimit,
        memory_limit: memoryLimit,
        difficulty,
      })
      setProblemId(problem.id)
      toast.success('Tạo bài tập thành công!')
    } catch (error) {
      console.error('Failed to create problem:', error)
      toast.error('Tạo bài tập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestCases = async () => {
    if (!problemId) return

    setLoading(true)
    try {
      for (const tc of testCases) {
        await problemsApi.addTestCase(problemId, {
          input: tc.input,
          expected_output: tc.expected_output,
          is_sample: tc.is_sample,
          is_hidden: !tc.is_sample,
          points: tc.points,
        })
      }
      toast.success('Thêm test case thành công!')
      navigate(-1)
    } catch (error) {
      console.error('Failed to add test cases:', error)
      toast.error('Thêm test case thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo bài tập lập trình</h1>

        {!problemId ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề bài tập
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="VD: Tính tổng hai số"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả bài toán
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={6}
                placeholder="Mô tả chi tiết bài toán..."
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngôn ngữ
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thời gian (ms)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bộ nhớ (MB)
                </label>
                <input
                  type="number"
                  value={memoryLimit}
                  onChange={(e) => setMemoryLimit(Number(e.target.value))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Độ khó
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="input"
                >
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code khởi tạo
              </label>
              <textarea
                value={starterCode}
                onChange={(e) => setStarterCode(e.target.value)}
                className="input font-mono"
                rows={6}
              />
            </div>

            <button
              onClick={handleCreateProblem}
              disabled={loading || !title || !description}
              className="btn-primary"
            >
              {loading ? 'Đang tạo...' : 'Tạo bài tập'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 text-green-800 p-4 rounded-lg">
              Bài tập đã được tạo! Bây giờ thêm test case.
            </div>

            {/* Test Cases */}
            <div className="space-y-4">
              {testCases.map((tc, index) => (
                <div key={tc.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Test Case {index + 1}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={tc.is_sample}
                          onChange={(e) => updateTestCase(index, 'is_sample', e.target.checked)}
                          className="w-4 h-4"
                        />
                        Sample
                      </label>
                      <button
                        onClick={() => removeTestCase(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        className="input font-mono"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Expected Output</label>
                      <textarea
                        value={tc.expected_output}
                        onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                        className="input font-mono"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Điểm:</label>
                    <input
                      type="number"
                      value={tc.points}
                      onChange={(e) => updateTestCase(index, 'points', Number(e.target.value))}
                      className="input w-24 ml-2"
                      min={0}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addTestCase} className="btn-outline">
              <Plus size={16} className="mr-2 inline" />
              Thêm test case
            </button>

            <button
              onClick={handleAddTestCases}
              disabled={loading || testCases.length === 0}
              className="btn-primary"
            >
              {loading ? 'Đang lưu...' : 'Lưu test cases'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
