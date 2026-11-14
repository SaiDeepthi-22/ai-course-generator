import React from 'react'

export default function ProgressBar({ percent = 0, label }) {
  const safePercent = Math.max(0, Math.min(100, percent))
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{safePercent}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-600 rounded-full transition-all duration-500"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}
