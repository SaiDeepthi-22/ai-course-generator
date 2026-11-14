import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse, getProgress } from '../api/client'
import TopBar from '../components/TopBar'

const CONFETTI_COLORS = ['#9f1d4c', '#f59e0b', '#10b981', '#6366f1', '#e0578f']

function Confetti() {
  const pieces = Array.from({ length: 24 })
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.6
        const duration = 1.8 + Math.random() * 1.2
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        return (
          <span
            key={i}
            className="absolute top-0 w-1.5 h-3 rounded-sm confetti-piece"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        )
      })}
    </div>
  )
}

export default function Completion() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState(null)

  useEffect(() => {
    getCourse(courseId).then(setCourse).catch(() => {})
    getProgress(courseId).then(setProgress).catch(() => {})
  }, [courseId])

  return (
    <div>
      <TopBar searchPlaceholder="Search for anything..." />
      <div className="relative max-w-lg mx-auto px-6 py-24 text-center animate-fadeIn overflow-hidden">
        <Confetti />
        <div className="text-5xl mb-4">🎓</div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Course completed!</h1>
        <p className="text-slate-500 mb-6">
          You finished <span className="font-medium text-slate-700">{course?.title || course?.topic}</span>.
        </p>

        {progress && (
          <div className="card p-5 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-500">Modules completed</span>
              <span className="font-medium text-slate-900">{progress.completed_modules} / {progress.total_modules}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Average quiz score</span>
              <span className="font-medium text-slate-900">{progress.average_quiz_score ?? '—'}%</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Link to="/dashboard" className="btn-primary">Back to dashboard</Link>
          <Link to="/create" className="btn-secondary">Generate another course</Link>
        </div>
      </div>
    </div>
  )
}
