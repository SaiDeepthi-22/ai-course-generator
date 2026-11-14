import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses, getProgress } from '../api/client'
import TopBar from '../components/TopBar'
import CourseCard from '../components/CourseCard'

export default function MyCourses() {
  const [courses, setCourses] = useState([])
  const [progressByCourse, setProgressByCourse] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listCourses()
      .then(async (list) => {
        setCourses(list)
        const entries = await Promise.all(
          list.map(async (c) => {
            try {
              const p = await getProgress(c.id)
              return [c.id, p.percent_complete]
            } catch {
              return [c.id, 0]
            }
          })
        )
        setProgressByCourse(Object.fromEntries(entries))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = courses.filter((c) => (c.title || c.topic).toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <TopBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search your courses..." />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My Courses</h1>
            <p className="text-sm text-slate-500">Everything you've generated, in one place.</p>
          </div>
          <Link to="/create" className="btn-primary">+ New course</Link>
        </div>

        {loading && <p className="text-slate-400 text-sm">Loading your courses…</p>}
        {error && <p className="text-rose-600 text-sm">{error}</p>}

        {!loading && filtered.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-slate-500 mb-4">
              {courses.length === 0 ? "You haven't created a course yet." : 'No courses match your search.'}
            </p>
            {courses.length === 0 && <Link to="/create" className="btn-primary">Generate your first course</Link>}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} percentComplete={progressByCourse[c.id] ?? 0} />
          ))}
        </div>
      </div>
    </div>
  )
}
