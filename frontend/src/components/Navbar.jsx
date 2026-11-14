import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../api/AuthContext'

export default function Navbar() {
  const { isAuthenticated, userName, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-slate-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm">AI</span>
          Course Generator
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900 px-2">Dashboard</Link>
              <Link to="/create" className="btn-primary text-sm py-2 px-3.5">New course</Link>
              <button
                onClick={() => { logout(); navigate('/') }}
                className="text-sm text-slate-500 hover:text-slate-800 px-2"
              >
                Log out ({userName})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 px-2">Log in</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-3.5">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
