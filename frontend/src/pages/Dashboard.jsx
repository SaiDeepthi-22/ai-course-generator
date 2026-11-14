import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses } from '../api/client'
import CourseCard from '../components/CourseCard'

export default function Dashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listCourses()
      .then(setCourses)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Your courses</h1>
          <p className="text-sm text-slate-500">Everything you've generated, in one place.</p>
        </div>
        <Link to="/create" className="btn-primary">+ New course</Link>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading your courses…</p>}
      {error && <p className="text-rose-600 text-sm">{error}</p>}

      {!loading && courses.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-500 mb-4">You haven't created a course yet.</p>
          <Link to="/create" className="btn-primary">Generate your first course</Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => <CourseCard key={c.id} course={c} />)}
      </div>
    </div>
  )
}
