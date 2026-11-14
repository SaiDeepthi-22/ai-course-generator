import React from 'react'

export default function TopBar({ searchValue, onSearchChange, searchPlaceholder = 'Search for anything...' }) {
  return (
    <header className="h-16 border-b border-slate-100 bg-white px-6 flex items-center gap-4 sticky top-0 z-20">
      <div className="flex-1 max-w-md relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={searchValue ?? ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>
    </header>
  )
}
