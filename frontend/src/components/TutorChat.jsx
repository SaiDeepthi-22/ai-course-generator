import React, { useState, useRef, useEffect } from 'react'
import { sendTutorMessage, getTutorHistory } from '../api/client'

export default function TutorChat({ courseId, moduleId }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      getTutorHistory(courseId).then(setMessages).catch(() => {})
    }
  }, [open, courseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setError('')
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setSending(true)
    try {
      const res = await sendTutorMessage(courseId, moduleId, text)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setError(e.message || 'The tutor is unavailable right now.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg flex items-center justify-center text-2xl z-50"
        aria-label="Open AI tutor chat"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-w-[92vw] h-[480px] card flex flex-col shadow-xl z-50 animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <p className="font-medium text-sm text-slate-900">AI Tutor</p>
          <p className="text-xs text-slate-400">Ask about this course</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-6">
            Ask me anything about this module — doubts, explanations, extra examples.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="dots-loading"><span/><span/><span/></div>}
        {error && <p className="text-xs text-rose-500">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-100 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type your question…"
          className="input-field resize-none text-sm"
        />
        <button onClick={send} disabled={sending || !input.trim()} className="btn-primary text-sm px-3">
          Send
        </button>
      </div>
    </div>
  )
}
