import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../api/AuthContext'

// Small inline icon set so we don't need an extra icon-library dependency.
const icons = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5" />,
  courses: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />,
  generate: <path d="m5 3 1.5 4L11 8.5 6.5 10 5 14l-1.5-4L-1 8.5 3.5 7 5 3Z M17 12l1 2.7L21 16l-3 1.3L17 20l-1-2.7L13 16l3-1.3L17 12Z" />,
  tutor: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />,
  progress: <path d="M3 3v18h18 M7 15l4-6 3 4 5-8" />,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.63.75 1.08 1.51 1H21a2 2 0 1 1 0 4h-.09c-.76 0-1.31.37-1.51 1Z" />,
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 flex-shrink-0">
      {icons[name]}
    </svg>
  )
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/courses', label: 'My Courses', icon: 'courses' },
  { to: '/create', label: 'Generate Course', icon: 'generate' },
  { to: '/tutor', label: 'AI Tutor', icon: 'tutor' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
  { to: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function Sidebar() {
  const { userName, logout } = useAuth()

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 border-r border-slate-100 bg-white flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white text-sm font-semibold">AI</span>
        <div>
          <p className="font-bold gradient-text leading-tight">CourseAI</p>
          <p className="text-[11px] text-brand-600 leading-tight">Learn Anything</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {userName?.[0]?.toUpperCase() || '?'}
          </span>
          <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
        </div>
        <button onClick={logout} title="Log out" className="text-slate-400 hover:text-slate-700 text-xs flex-shrink-0">
          Log out
        </button>
      </div>
    </aside>
  )
}
