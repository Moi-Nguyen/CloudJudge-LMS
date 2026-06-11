import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BookOpen, Users, Edit, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { coursesApi, lessonsApi, problemsApi, quizzesApi } from '@/api/endpoints'
import { useAuthStore } from '@/stores'
import type { CourseDetail, Lesson, Problem, Quiz } from '@/types'
import { cn, formatVietnamDateTime } from '@/utils'
import { LoadingSpinner } from '@/components/common'

const lessonTypeLabels = {
  video: 'Video',
  document: 'Tài liệu',
  quiz: 'Quiz',
  programming: 'Lập trình',
}

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuthStore()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [quizzesByLesson, setQuizzesByLesson] = useState<Record<string, Quiz>>({})
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [updatingLessonId, setUpdatingLessonId] = useState<string | null>(null)

  const isOwner = user?.id === course?.instructor_id
  const isAdmin = user?.role === 'admin'
  const canManage = isOwner || isAdmin

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return

      setLoading(true)
      try {
        const [courseData, lessonsData, problemsData] = await Promise.all([
          coursesApi.getCourse(courseId),
          lessonsApi.getCourseLessons(courseId),
          problemsApi.getCourseProblems(courseId),
        ])
        const quizLessons = lessonsData.items.filter((lesson) => lesson.lesson_type === 'quiz')
        const quizResults = await Promise.allSettled(
          quizLessons.map((lesson) => quizzesApi.getQuizByLesson(lesson.id))
        )
        const quizMap = quizResults.reduce<Record<string, Quiz>>((acc, result) => {
          if (result.status === 'fulfilled') {
            acc[result.value.lesson_id] = result.value
          }
          return acc
        }, {})
        setCourse(courseData)
        setLessons(lessonsData.items)
        setProblems(problemsData.items)
        setQuizzesByLesson(quizMap)
      } catch (error) {
        console.error('Failed to fetch course:', error)
        toast.error('Không thể tải thông tin khóa học')
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [courseId])

  const handleEnroll = async () => {
    if (!courseId) return

    setEnrolling(true)
    try {
      await coursesApi.enrollInCourse(courseId)
      toast.success('Đăng ký khóa học thành công!')
      const updatedCourse = await coursesApi.getCourse(courseId)
      setCourse(updatedCourse)
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Đăng ký thất bại'
      toast.error(message)
    } finally {
      setEnrolling(false)
    }
  }

  const refreshLesson = (updatedLesson: Lesson) => {
    setLessons((currentLessons) => currentLessons.map((lesson) => (
      lesson.id === updatedLesson.id ? updatedLesson : lesson
    )))
  }

  const handleTogglePublish = async (lesson: Lesson) => {
    setUpdatingLessonId(lesson.id)
    try {
      const updatedLesson = await lessonsApi.updateLesson(lesson.id, {
        is_published: !lesson.is_published,
      })
      refreshLesson(updatedLesson)
      toast.success(updatedLesson.is_published ? 'Lesson published' : 'Lesson moved to draft')
    } catch (error) {
      console.error('Failed to update lesson publish state:', error)
      toast.error('Could not update lesson status')
    } finally {
      setUpdatingLessonId(null)
    }
  }

  const handleEditLesson = async (lesson: Lesson) => {
    const title = window.prompt('Lesson title', lesson.title)
    if (title === null) return

    const description = window.prompt('Lesson description', lesson.description || '')
    if (description === null) return

    const content = window.prompt('Lesson content/description', lesson.content || '')
    if (content === null) return

    setUpdatingLessonId(lesson.id)
    try {
      const updatedLesson = await lessonsApi.updateLesson(lesson.id, {
        title,
        description,
        content,
      })
      refreshLesson(updatedLesson)
      toast.success('Lesson updated')
    } catch (error) {
      console.error('Failed to update lesson:', error)
      toast.error('Could not update lesson')
    } finally {
      setUpdatingLessonId(null)
    }
  }

  const getLessonManageLink = (lesson: Lesson, relatedQuiz?: Quiz, relatedProblem?: Problem) => {
    if (lesson.lesson_type === 'quiz') {
      return relatedQuiz ? `/instructor/quiz/${lesson.id}/new` : `/instructor/quiz/${lesson.id}/new`
    }
    if (lesson.lesson_type === 'programming') {
      return relatedProblem ? `/problem/${relatedProblem.id}` : `/instructor/problem/${lesson.id}/new`
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy khóa học</p>
        <Link to="/courses" className="text-primary-600 hover:underline mt-4 inline-block">
          Quay lại danh sách khóa học
        </Link>
      </div>
    )
  }

  const visibleLessonIds = new Set(lessons.map((lesson) => lesson.id))
  const visibleProblems = problems.filter((problem) => visibleLessonIds.has(problem.lesson_id))
  const quizLessons = lessons.filter((lesson) => lesson.lesson_type === 'quiz')
  const getLessonTitle = (lessonId: string) => {
    return lessons.find((lesson) => lesson.id === lessonId)?.title || 'Bài học lập trình'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
          <BookOpen className="text-primary-600" size={80} />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
              <p className="text-gray-600 mb-4">
                Giảng viên: <span className="font-medium">{course.instructor.full_name}</span>
              </p>
              <p className="text-gray-500">{course.description || 'Không có mô tả'}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {lessons.length} bài học
                </span>
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {course.student_count} học viên
                </span>
              </div>
              {canManage ? (
                <Link
                  to={`/instructor/edit-course/${course.id}`}
                  className="btn-outline"
                >
                  <Edit size={16} className="mr-2 inline" />
                  Chỉnh sửa
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary"
                >
                  {enrolling ? 'Đang đăng ký...' : 'Đăng ký khóa học'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Nội dung khóa học</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có bài học nào</p>
        ) : (
          <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const relatedProblem = problems.find((problem) => problem.lesson_id === lesson.id)
                const relatedQuiz = quizzesByLesson[lesson.id]
                return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    <p className="text-sm text-gray-500">{lesson.description}</p>
                    {lesson.is_published && lesson.updated_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        Cập nhật lần cuối: {formatVietnamDateTime(lesson.updated_at)}
                      </p>
                    )}
                    {(lesson.lesson_type === 'document' || lesson.lesson_type === 'video') && (lesson.file_url || lesson.external_url) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {lesson.file_url && (
                          <a href={lesson.file_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-1">
                            <ExternalLink size={14} /> {lesson.file_name || 'Open file'}
                          </a>
                        )}
                        {lesson.external_url && (
                          <a href={lesson.external_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-1">
                            <ExternalLink size={14} /> Open external link
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <span className={cn(
                      'badge',
                      lesson.is_published ? 'badge-success' : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {lesson.is_published ? 'Published' : 'Draft'}
                    </span>
                  )}
                  <span className={cn(
                    'badge',
                    lesson.lesson_type === 'video' && 'badge-primary',
                    lesson.lesson_type === 'quiz' && 'badge-success',
                    lesson.lesson_type === 'programming' && 'badge-warning',
                    lesson.lesson_type === 'document' && 'bg-gray-100 text-gray-800'
                  )}>
                    {lessonTypeLabels[lesson.lesson_type]}
                  </span>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditLesson(lesson)}
                        disabled={updatingLessonId === lesson.id}
                        className="btn-ghost text-sm"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(lesson)}
                        disabled={updatingLessonId === lesson.id}
                        className="btn-ghost text-sm"
                      >
                        {lesson.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      {getLessonManageLink(lesson, relatedQuiz, relatedProblem) && (
                        <Link to={getLessonManageLink(lesson, relatedQuiz, relatedProblem)!} className="btn-ghost text-sm">
                          {lesson.lesson_type === 'quiz' ? 'Sửa quiz' : 'Sửa problem'}
                        </Link>
                      )}
                    </>
                  )}
                  <Link
                    to={lesson.lesson_type === 'quiz'
                      ? relatedQuiz ? `/quiz/${relatedQuiz.id}` : '#'
                      : relatedProblem
                        ? `/problem/${relatedProblem.id}`
                        : '#'}
                    className="btn-ghost text-sm"
                  >
                    {lesson.lesson_type === 'quiz' ? 'Làm quiz' : 'Xem'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {canManage && (
          <div className="mt-6 pt-6 border-t">
            <Link
              to={`/instructor/lesson/${course.id}/new`}
              className="btn-primary"
            >
              Thêm bài học
            </Link>
          </div>
        )}
      </div>

      {/* Programming problems */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Bài tập lập trình</h2>
        {visibleProblems.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có bài tập lập trình nào</p>
        ) : (
          <div className="space-y-2">
            {visibleProblems.map((problem) => (
              <div
                key={problem.id}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{problem.title}</h3>
                  <p className="text-sm text-gray-500">{getLessonTitle(problem.lesson_id)}</p>
                </div>
                <span className="badge badge-warning">{problem.difficulty}</span>
                <Link to={`/problem/${problem.id}`} className="btn-ghost text-sm">
                  Xem bài
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quizzes */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Quizzes</h2>
        {quizLessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Chưa có quiz nào</p>
        ) : (
          <div className="space-y-2">
            {quizLessons.map((lesson) => {
              const relatedQuiz = quizzesByLesson[lesson.id]
              return (
              <div
                key={lesson.id}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                  <p className="text-sm text-gray-500">{lesson.description}</p>
                </div>
                <Link to={relatedQuiz ? `/quiz/${relatedQuiz.id}` : '#'} className="btn-ghost text-sm">
                  Làm quiz
                </Link>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}



