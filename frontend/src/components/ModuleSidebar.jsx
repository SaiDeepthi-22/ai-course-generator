import React from 'react'

export default function ModuleSidebar({ modules, activeModuleId, onSelect, completedIds = new Set() }) {
  return (
    <aside className="card p-3 h-fit sticky top-20">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-2">Modules</h4>
      <ul className="space-y-1">
        {modules.map((m, idx) => {
          const isActive = m.id === activeModuleId
          const isDone = completedIds.has(m.id)
          return (
            <li key={m.id}>
              <button
                onClick={() => onSelect(m)}
                className={`w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`flex-shrink-0 h-5 w-5 rounded-full text-[10px] flex items-center justify-center ${
                    isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </span>
                <span className="line-clamp-1">{m.title}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
