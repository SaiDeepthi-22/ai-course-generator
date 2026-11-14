import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../api/AuthContext'

const FEATURE_ICONS = ['🎯', '📚', '🤖']

export default function Landing() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="relative overflow-hidden">
      {/* Floating gradient blobs — pure CSS, no extra JS */}
      <div className="blob h-72 w-72 bg-brand-400 -top-10 -left-10" />
      <div className="blob h-72 w-72 bg-amber-300 top-20 right-0" style={{ animationDelay: '2s' }} />
      <div className="blob h-56 w-56 bg-pink-300 bottom-0 left-1/3" style={{ animationDelay: '4s' }} />

      <div className="relative max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="sparkle inline-block text-xs font-medium tracking-wide uppercase text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-6">
          ✨ Generative AI · EdTech
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-4">
          Turn any topic into a complete course, <span className="gradient-text">instantly</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
          Enter a topic, pick your level and available time, and an LLM builds a full syllabus —
          lessons, real-world examples, code samples, quizzes and assignments — personalized to you.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to={isAuthenticated ? '/create' : '/register'} className="btn-primary px-6 py-3">
            {isAuthenticated ? 'Create a course' : 'Get started free'}
          </Link>
          <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn-secondary px-6 py-3">
            {isAuthenticated ? 'My dashboard' : 'Log in'}
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-16 text-left">
          {[
            { title: 'Any topic, any level', desc: 'From "Python basics" to "Quantum computing" — calibrated to beginner, intermediate, or advanced.' },
            { title: 'Full learning material', desc: 'Explanations, real-world examples, code samples, quizzes, and assignments — generated per module.' },
            { title: 'AI tutor + progress tracking', desc: 'Ask doubts anytime, track quiz scores, and let weak modules regenerate themselves.' },
          ].map((f, i) => (
            <div key={f.title} className="glass tilt-card rounded-xl p-5 shadow-sm">
              <span className="text-2xl mb-2 block">{FEATURE_ICONS[i]}</span>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
