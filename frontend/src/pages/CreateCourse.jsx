import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createCourse } from '../api/client'
import TopBar from '../components/TopBar'

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner', desc: 'New to the topic' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some existing knowledge' },
  { value: 'advanced', label: 'Advanced', desc: 'Deep, technical depth' },
]

const DURATIONS = ['3 hours', '1 week', '2 weeks', '1 month']

function loadDefaultPrefs() {
  try {
    return JSON.parse(localStorage.getItem('course_defaults')) || {}
  } catch {
    return {}
  }
}

export default function CreateCourse() {
  const location = useLocation()
  const defaults = loadDefaultPrefs()
  const [topic, setTopic] = useState(location.state?.prefillTopic || '')
  const [difficulty, setDifficulty] = useState(defaults.difficulty || 'beginner')
  const [duration, setDuration] = useState(defaults.duration || '1 week')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (topic.trim().length < 2) {
      setError('Please enter a topic (at least 2 characters).')
      return
    }
    setLoading(true)
    try {
      const course = await createCourse(topic.trim(), difficulty, duration, goal.trim() || null)
      navigate(`/courses/${course.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <TopBar searchPlaceholder="Search for anything..." />
    <div className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">Create a new course</h1>
      <p className="text-sm text-slate-500 mb-8">Tell the AI what you want to learn — it builds the rest.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">What do you want to learn?</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field"
            placeholder="e.g. Machine Learning, Guitar for beginners, System Design"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Difficulty level</label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                type="button"
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  difficulty === d.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{d.label}</p>
                <p className="text-xs text-slate-500">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Available learning duration</label>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDuration(d)}
                className={`text-sm px-3.5 py-2 rounded-full border transition-colors ${
                  duration === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Learning goal <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="input-field"
            placeholder="e.g. Prepare for a job interview, build a personal project"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Generating your course… this can take up to a minute' : 'Generate course'}
        </button>
      </form>
    </div>
    </div>
  )
}
