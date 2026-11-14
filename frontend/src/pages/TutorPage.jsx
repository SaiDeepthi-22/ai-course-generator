import React, { useEffect, useState, useRef } from 'react'
import { listCourses, sendTutorMessage, getTutorHistory } from '../api/client'
import TopBar from '../components/TopBar'

export default function TutorPage() {
  const [courses, setCourses] = useState([])
  const [courseId, setCourseId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    listCourses().then((list) => {
      setCourses(list)
      if (list.length > 0) setCourseId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!courseId) return
    getTutorHistory(courseId).then(setMessages).catch(() => setMessages([]))
  }, [courseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || !courseId) return
    setError('')
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    try {
      const res = await sendTutorMessage(courseId, null, text)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <TopBar searchPlaceholder="Search for anything..." />
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">AI Tutor</h1>
        <p className="text-sm text-slate-500 mb-5">Ask doubts, get explanations, and review any of your courses.</p>

        {courses.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">Create a course first to start chatting with your AI tutor.</div>
        ) : (
          <>
            <select
              value={courseId ?? ''}
              onChange={(e) => setCourseId(Number(e.target.value))}
              className="input-field mb-4 max-w-sm"
            >
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title || c.topic}</option>)}
            </select>

            <div className="card p-4 h-[440px] flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {messages.length === 0 && <p className="text-sm text-slate-400 text-center mt-10">Ask your first question about this course.</p>}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] text-sm px-3 py-2 rounded-2xl whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>{m.content}</div>
                  </div>
                ))}
                {sending && <div className="dots-loading"><span/><span/><span/></div>}
                {error && <p className="text-xs text-rose-500">{error}</p>}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-100 mt-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type your question…"
                  className="input-field text-sm"
                />
                <button onClick={send} disabled={sending || !input.trim()} className="btn-primary text-sm px-4">Send</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
