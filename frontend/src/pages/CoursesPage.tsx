import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Filter, Search, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { coursesApi, getApiErrorMessage } from '@/api/endpoints'
import { useAuthStore } from '@/stores'
import type { Course } from '@/types'

const getErrorDetail = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response
    const detail = response?.data?.detail

    if (response?.status === 400 && typeof detail === 'string' && detail.toLowerCase().includes('already')) {
      return 'You are already enrolled in this course.'
    }
    if (response?.status === 401) return 'Your session has expired. Please log in again.'
    if (response?.status === 403) return 'You do not have permission to enroll in this course.'
    if (response?.status === 422) return 'Enrollment request is invalid. Please try again.'
    if (typeof detail === 'string') return detail
  }

  return fallback || getApiErrorMessage(error)
}

export default function CoursesPage() {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      try {
        const [courseResponse, myCoursesResponse] = await Promise.all([
          coursesApi.listCourses({ page, page_size: 12, search: search || undefined }),
          user?.role === 'student' ? coursesApi.getMyCourses({ page_size: 100 }) : Promise.resolve(null),
        ])

        setCourses(courseResponse.items ?? [])
        setTotalPages(courseResponse.pages ?? courseResponse.total_pages ?? 1)
        if (myCoursesResponse) {
          setEnrolledCourseIds(new Set((myCoursesResponse.items ?? []).map((enrollment) => enrollment.course_id || enrollment.course?.id).filter(Boolean)))
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error)
        setCourses([])
        setError(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [page, search, user?.role])

  const handleEnroll = async (courseId: string) => {
    if (enrolledCourseIds.has(courseId)) {
      toast('You are already enrolled in this course.')
      return
    }

    setEnrollingCourseId(courseId)
    try {
      await coursesApi.enrollCourse(courseId)
      setEnrolledCourseIds((current) => new Set(current).add(courseId))
      toast.success('Course enrolled successfully!')
    } catch (error) {
      console.error('Failed to enroll course:', error)
      toast.error(getErrorDetail(error, 'Could not enroll in this course.'))
    } finally {
      setEnrollingCourseId(null)
    }
  }

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="page-heading">Explore courses</h1><p className="page-subtitle">Find the right course, review content, and start learning faster.</p></div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm"><Filter size={14} />{loading ? 'Updating' : `${courses.length} courses`}</div>
      </div>
      <div className="card p-3 sm:p-4"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Search courses by title..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input pl-12" /></div></div>
      {loading ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card" />)}</div> : error ? <div className="empty-state text-red-600">{error}</div> : courses.length === 0 ? <div className="empty-state"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><BookOpen size={32} /></div><h2 className="text-lg font-semibold text-slate-950">No courses found</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Try a different keyword or clear the search to see more content.</p></div> : <><div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id)
        const isEnrolling = enrollingCourseId === course.id
        return (
          <div key={course.id} className="card-hover group overflow-hidden">
            <Link to={`/courses/${course.id}`} className="block">
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 via-white to-secondary-100"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.20),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.16),transparent_30%)]" /><div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">{course.is_published ? 'Published' : 'Private'}</div><BookOpen className="absolute bottom-5 right-5 text-primary-600 transition-transform duration-200 group-hover:scale-110" size={48} /></div>
              <div className="p-5 pb-3"><h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">{course.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{course.description || 'No description yet'}</p></div>
            </Link>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Users size={15} />{course.is_published ? 'Ready to learn' : 'Draft'}</span>
              {user?.role === 'student' ? (
                <button type="button" onClick={() => handleEnroll(course.id)} disabled={isEnrolled || isEnrolling} className={isEnrolled ? 'btn-outline cursor-not-allowed opacity-70' : 'btn-primary'}>
                  {isEnrolled ? 'Enrolled' : isEnrolling ? 'Enrolling...' : 'Enroll'}
                </button>
              ) : (
                <Link to={`/courses/${course.id}`} className="inline-flex items-center gap-1 font-semibold text-primary-600">View <ArrowRight className="transition group-hover:translate-x-1" size={17} /></Link>
              )}
            </div>
          </div>
        )
      })}</div>{totalPages > 1 && <div className="flex flex-col items-center justify-center gap-3 sm:flex-row"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline">Previous</button><span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">Page {page} / {totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline">Next</button></div>}</>}
    </div>
  )
}
