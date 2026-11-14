import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCourses, getProgress } from '../api/client'
import TopBar from '../components/TopBar'
import ProgressBar from '../components/ProgressBar'
import DonutChart from '../components/DonutChart'

export default function ProgressPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listCourses().then(async (list) => {
      const withProgress = await Promise.all(
        list.map(async (c) => {
          try {
            const p = await getProgress(c.id)
            return { course: c, progress: p }
          } catch {
            return { course: c, progress: null }
          }
        })
      )
      setRows(withProgress)
      setLoading(false)
    })
  }, [])

  const completedCount = rows.filter((r) => r.course.status === 'completed').length
  const inProgressCount = rows.filter((r) => r.course.status !== 'completed' && (r.progress?.percent_complete || 0) > 0).length
  const notStartedCount = rows.length - completedCount - inProgressCount

  return (
    <div>
      <TopBar searchPlaceholder="Search for anything..." />
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Progress</h1>
        <p className="text-sm text-slate-500 mb-6">Track completion and quiz performance across every course.</p>

        {loading && <p className="text-slate-400 text-sm">Loading…</p>}

        {!loading && rows.length === 0 && (
          <div className="card p-8 text-center text-slate-500">
            No courses yet. <Link to="/create" className="text-brand-600 font-medium">Generate one</Link> to start tracking progress.
          </div>
        )}

        {rows.length > 0 && (
          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Overall</h3>
            <DonutChart
              centerValue={`${Math.round((completedCount / rows.length) * 100)}%`}
              centerLabel="Overall Progress"
              segments={[
                { label: 'Completed', value: completedCount || 0.0001, color: '#10b981' },
                { label: 'In Progress', value: inProgressCount || 0.0001, color: '#f59e0b' },
                { label: 'Not Started', value: notStartedCount || 0.0001, color: '#cbd5e1' },
              ]}
            />
          </div>
        )}

        <div className="space-y-3">
          {rows.map(({ course, progress }) => (
            <Link to={`/courses/${course.id}`} key={course.id} className="card p-4 block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-slate-900">{course.title || course.topic}</p>
                <span className="text-xs text-slate-400">
                  {progress ? `${progress.completed_modules}/${progress.total_modules} modules` : '—'}
                </span>
              </div>
              <ProgressBar percent={progress?.percent_complete || 0} />
              {progress?.average_quiz_score != null && (
                <p className="text-xs text-slate-400 mt-1.5">Average quiz score: {progress.average_quiz_score}%</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
