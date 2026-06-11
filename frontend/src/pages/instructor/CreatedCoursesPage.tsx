import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, FileText, PlusCircle, Search, Users } from 'lucide-react'
import { coursesApi, getApiErrorMessage } from '@/api/endpoints'
import type { Course } from '@/types'

export default function CreatedCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchCreatedCourses = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await coursesApi.getMyCreatedCourses({ page, page_size: 12 })
        setCourses(response.items ?? [])
        setTotalPages(response.pages ?? response.total_pages ?? 1)
      } catch (error) {
        console.error('Failed to fetch created courses:', error)
        setCourses([])
        setError(getApiErrorMessage(error))
      } finally {
        setLoading(false)
      }
    }

    fetchCreatedCourses()
  }, [page])

  const visibleCourses = courses.filter((course) => course.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="page-heading">Created courses</h1>
          <p className="page-subtitle">Manage every course you created, including drafts that do not appear in Explore courses.</p>
        </div>
        <Link to="/instructor/create-course" className="btn-primary w-fit"><PlusCircle size={18} />Create course</Link>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search your created courses..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-12" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card" />)}</div>
      ) : error ? (
        <div className="empty-state text-red-600">{error}</div>
      ) : visibleCourses.length === 0 ? (
        <div className="empty-state">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><BookOpen size={32} /></div>
          <h2 className="text-lg font-semibold text-slate-950">No created courses found</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">Create a course to see it here immediately. Draft courses stay private until you publish them.</p>
          <Link to="/instructor/create-course" className="btn-primary mt-5"><PlusCircle size={18} />Create course</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => (
              <article key={course.id} className="card group overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 via-white to-secondary-100">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.20),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.16),transparent_30%)]" />
                  <div className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur ${course.is_published ? 'bg-emerald-50/90 text-emerald-700' : 'bg-amber-50/90 text-amber-700'}`}>{course.is_published ? 'Published' : 'Draft'}</div>
                  <BookOpen className="absolute bottom-5 right-5 text-primary-600 transition-transform duration-200 group-hover:scale-110" size={48} />
                </div>
                <div className="p-5">
                  <h2 className="line-clamp-2 text-lg font-bold text-slate-950">{course.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{course.description || 'No description yet.'}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><Users size={15} />{course.student_count ?? 0} students</span>
                    <span className="flex items-center gap-1.5"><FileText size={15} />{course.lesson_count ?? 0} lessons</span>
                  </div>
                  <Link to={`/instructor/edit-course/${course.id}`} className="btn-outline mt-5 w-full justify-center">Manage course<ArrowRight size={16} /></Link>
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
              <span className="text-sm font-medium text-slate-500">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
