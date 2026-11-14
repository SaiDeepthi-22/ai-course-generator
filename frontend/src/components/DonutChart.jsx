import React from 'react'

// Renders a donut chart from an array of {label, value, colorClass} segments
// using a CSS conic-gradient — no charting library needed.
export default function DonutChart({ segments, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  let cursor = 0
  const stops = segments.map((s) => {
    const start = (cursor / total) * 360
    cursor += s.value
    const end = (cursor / total) * 360
    return `${s.color} ${start}deg ${end}deg`
  })

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-32 w-32 rounded-full flex-shrink-0"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
      >
        <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-900">{centerValue}</span>
          <span className="text-[10px] text-slate-400 text-center leading-tight px-2">{centerLabel}</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-slate-500 w-24">{s.label}</span>
            <span className="font-medium text-slate-800">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
