import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCourses, getProgress, createCourse, sendTutorMessage } from '../api/client'
import TopBar from '../components/TopBar'
import CourseCard from '../components/CourseCard'
import DonutChart from '../components/DonutChart'
import { useAuth } from '../api/AuthContext'

const SUGGESTIONS = ['Deep Learning Fundamentals', 'System Design', 'Public Speaking', 'Guitar for Beginners', 'Personal Finance']
const TUTOR_QUICK_ACTIONS = [
  { label: 'Explain a concept', prompt: 'Can you explain a key concept from this course in simple terms?' },
  { label: 'Solve a problem', prompt: 'Can you walk me through solving a practice problem from this module?' },
  { label: 'Quiz me', prompt: 'Ask me a quick question to test my understanding so far.' },
  { label: 'Recommend topics', prompt: 'What should I study next to build on what I\'ve learned?' },
]

export default function Home() {
  const { userName } = useAuth()
  const navigate = useNavigate()

  const [courses, setCourses] = useState([])
  const [progressByCourse, setProgressByCourse] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  // Hero inline generate form
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState(() => {
    try { return JSON.parse(localStorage.getItem('course_defaults'))?.difficulty || 'beginner' } catch { return 'beginner' }
  })
  const [duration, setDuration] = useState(() => {
    try { return JSON.parse(localStorage.getItem('course_defaults'))?.duration || '1 week' } catch { return '1 week' }
  })
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')

  // Tutor preview panel
  const [tutorInput, setTutorInput] = useState('')
  const [tutorReply, setTutorReply] = useState("Hi! 👋 How can I help you learn today?")
  const [tutorSending, setTutorSending] = useState(false)

  useEffect(() => {
    listCourses()
      .then(async (list) => {
        setCourses(list)
        const entries = await Promise.all(
          list.map(async (c) => {
            try {
              const p = await getProgress(c.id)
              return [c.id, p.percent_complete]
            } catch {
              return [c.id, 0]
            }
          })
        )
        setProgressByCourse(Object.fromEntries(entries))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenError('')
    if (topic.trim().length < 2) {
      setGenError('Please enter a topic to generate a course.')
      return
    }
    setGenerating(true)
    try {
      const course = await createCourse(topic.trim(), difficulty, duration, null)
      navigate(`/courses/${course.id}`)
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const mostRecentCourse = courses[0]

  const handleTutorQuickAction = (prompt) => setTutorInput(prompt)

  const handleTutorSend = async () => {
    if (!tutorInput.trim() || !mostRecentCourse) return
    setTutorSending(true)
    try {
      const res = await sendTutorMessage(mostRecentCourse.id, null, tutorInput.trim())
      setTutorReply(res.reply)
      setTutorInput('')
    } catch (err) {
      setTutorReply(err.message)
    } finally {
      setTutorSending(false)
    }
  }

  const filteredCourses = courses.filter((c) =>
    (c.title || c.topic).toLowerCase().includes(search.toLowerCase())
  )
  const visibleCourses = showAll ? filteredCourses : filteredCourses.slice(0, 4)

  const suggestedTopic = SUGGESTIONS.find(
    (s) => !courses.some((c) => (c.title || c.topic).toLowerCase().includes(s.toLowerCase()))
  ) || SUGGESTIONS[0]

  const completedCount = courses.filter((c) => c.status === 'completed').length
  const inProgressCount = courses.filter((c) => c.status !== 'completed' && (progressByCourse[c.id] || 0) > 0).length
  const notStartedCount = courses.length - completedCount - inProgressCount

  return (
    <div>
      <TopBar searchValue={search} onSearchChange={setSearch} />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 via-pink-50 to-orange-50 border border-brand-100 p-8 mb-8">
          <div className="blob h-56 w-56 bg-brand-300 -top-16 -right-10" />
          <h1 className="relative text-3xl font-bold text-slate-900 mb-2">
            Generate Courses on <span className="gradient-text">Any Topic with AI</span> ✨
          </h1>
          <p className="relative text-slate-500 mb-6 max-w-xl">
            Enter any topic and let AI create a personalized course just for you, {userName?.split(' ')[0]}. Learn smarter, not harder.
          </p>

          <form onSubmit={handleGenerate} className="relative bg-white rounded-xl border border-slate-200 p-2 flex flex-col sm:flex-row gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What do you want to learn?"
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
            />
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-2 bg-white">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-2 py-2 bg-white">
              <option>3 hours</option>
              <option>1 week</option>
              <option>2 weeks</option>
              <option>1 month</option>
            </select>
            <button type="submit" disabled={generating} className="btn-primary text-sm whitespace-nowrap">
              {generating ? 'Generating…' : '✨ Generate Course'}
            </button>
          </form>
          {genError && <p className="text-sm text-rose-600 mt-2">{genError}</p>}
        </div>

        {/* Learning hub */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">🌱 Your Learning Hub</h2>
          {filteredCourses.length > 4 && (
            <button onClick={() => setShowAll((s) => !s)} className="text-sm text-brand-600 font-medium">
              {showAll ? 'Show less' : 'View All'}
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-slate-400 mb-8">Loading your courses…</p>}
        {!loading && courses.length === 0 && (
          <div className="card p-8 text-center mb-8">
            <p className="text-slate-500 mb-3">No courses yet — generate your first one above.</p>
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {visibleCourses.map((c) => (
            <CourseCard key={c.id} course={c} percentComplete={progressByCourse[c.id] ?? 0} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recommended */}
          <div className="card p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">✨ Recommended for You</h3>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="font-medium text-slate-900 mb-1">{suggestedTopic}</p>
              <p className="text-xs text-slate-500 mb-3">A topic you haven't explored yet — generate a course on it in one click.</p>
              <button
                onClick={() => navigate('/create', { state: { prefillTopic: suggestedTopic } })}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Start Learning
              </button>
            </div>
          </div>

          {/* AI Tutor preview */}
          <div className="card p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">🤖 AI Tutor</h3>
            {!mostRecentCourse ? (
              <p className="text-xs text-slate-400">Create a course first to start chatting with your AI tutor.</p>
            ) : (
              <>
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 mb-3 min-h-[52px]">{tutorReply}</div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {TUTOR_QUICK_ACTIONS.map((a) => (
                    <button key={a.label} onClick={() => handleTutorQuickAction(a.prompt)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700">
                      {a.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tutorInput}
                    onChange={(e) => setTutorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTutorSend()}
                    placeholder="Ask me anything…"
                    className="input-field text-sm"
                  />
                  <button onClick={handleTutorSend} disabled={tutorSending} className="btn-primary text-sm px-3">➤</button>
                </div>
              </>
            )}
          </div>

          {/* Progress donut */}
          <div className="card p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Learning Progress</h3>
            {courses.length === 0 ? (
              <p className="text-xs text-slate-400">Your progress will appear here once you start a course.</p>
            ) : (
              <DonutChart
                centerValue={`${Math.round(((completedCount) / courses.length) * 100)}%`}
                centerLabel="Overall Progress"
                segments={[
                  { label: 'Completed', value: completedCount || 0.0001, color: '#10b981' },
                  { label: 'In Progress', value: inProgressCount || 0.0001, color: '#f59e0b' },
                  { label: 'Not Started', value: notStartedCount || 0.0001, color: '#cbd5e1' },
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
