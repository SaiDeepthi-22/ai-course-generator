import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProtectedRoute from './ProtectedRoute'

export default function AppShell() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </ProtectedRoute>
  )
}
