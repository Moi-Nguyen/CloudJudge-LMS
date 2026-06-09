import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, BookOpen, Users, Filter, ArrowRight } from 'lucide-react'
import { coursesApi } from '@/api/endpoints'
import type { Course } from '@/types'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const response = await coursesApi.listCourses({ page, page_size: 12, search: search || undefined })
        setCourses(response.items)
        setTotalPages(response.total_pages)
      } catch (error) {
        console.error('Failed to fetch courses:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [page, search])

  return (
    <div className="page-shell">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="page-heading">Explore courses</h1><p className="page-subtitle">Find the right course, review content, and start learning faster.</p></div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm"><Filter size={14} />{loading ? 'Updating' : `${courses.length} courses`}</div>
      </div>
      <div className="card p-3 sm:p-4"><div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Search courses by title..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input pl-12" /></div></div>
      {loading ? <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton-card" />)}</div> : courses.length === 0 ? <div className="empty-state"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600"><BookOpen size={32} /></div><h2 className="text-lg font-semibold text-slate-950">No courses found</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Try a different keyword or clear the search to see more content.</p></div> : <><div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <Link key={course.id} to={`/courses/${course.id}`} className="card-hover group"><div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary-100 via-white to-secondary-100"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.20),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.16),transparent_30%)]" /><div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">{course.is_published ? 'Published' : 'Private'}</div><BookOpen className="absolute bottom-5 right-5 text-primary-600 transition-transform duration-200 group-hover:scale-110" size={48} /></div><div className="p-5"><h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950">{course.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{course.description || 'No description yet'}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500"><span className="flex items-center gap-1.5"><Users size={15} />{course.is_published ? 'Ready to learn' : 'Draft'}</span><ArrowRight className="transition group-hover:translate-x-1 group-hover:text-primary-600" size={17} /></div></div></Link>)}</div>{totalPages > 1 && <div className="flex flex-col items-center justify-center gap-3 sm:flex-row"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline">Previous</button><span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">Page {page} / {totalPages}</span><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline">Next</button></div>}</>}
    </div>
  )
}
