import React from 'react'
import { useNavigate } from 'react-router-dom'

const difficultyStyles = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-amber-50 text-amber-700',
  advanced: 'bg-rose-50 text-rose-700',
}

// Deterministic icon/color per course so cards feel varied without random flicker on re-render.
const PALETTE = [
  { bg: 'bg-violet-100', text: 'text-violet-600', icon: '🧠' },
  { bg: 'bg-amber-100', text: 'text-amber-600', icon: '💻' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600', icon: '📊' },
  { bg: 'bg-rose-100', text: 'text-rose-600', icon: '🎨' },
]

function pickStyle(id) {
  return PALETTE[id % PALETTE.length]
}

export default function CourseCard({ course, percentComplete = 0 }) {
  const navigate = useNavigate()
  const style = pickStyle(course.id)

  return (
    <button
      onClick={() => navigate(`/courses/${course.id}`)}
      className="card tilt-card p-5 text-left w-full animate-fadeIn"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`h-11 w-11 rounded-xl ${style.bg} ${style.text} flex items-center justify-center text-xl`}>
          {style.icon}
        </span>
        {course.status === 'completed' && (
          <span className="text-[11px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">Done</span>
        )}
      </div>

      <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{course.title || course.topic}</h3>
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 ${difficultyStyles[course.difficulty] || ''}`}>
        {course.difficulty}
      </span>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
        <div className="h-full bg-brand-600 rounded-full" style={{ width: `${percentComplete}%` }} />
      </div>
      <p className="text-xs text-slate-400">{percentComplete}% Complete</p>
    </button>
  )
}
