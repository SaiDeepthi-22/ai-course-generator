import React from 'react'
import TopBar from '../components/TopBar'

export default function Bookmarks() {
  return (
    <div>
      <TopBar searchPlaceholder="Search for anything..." />
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Bookmarks</h1>
        <p className="text-sm text-slate-500 mb-6">Save modules and lessons to revisit later.</p>
        <div className="card p-10 text-center text-slate-500">
          Bookmarking isn't wired up yet — this page is a placeholder for a future release.
        </div>
      </div>
    </div>
  )
}
