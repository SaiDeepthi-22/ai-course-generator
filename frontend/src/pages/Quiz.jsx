import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getModuleAssessments, submitQuiz } from '../api/client'
import TopBar from '../components/TopBar'

export default function Quiz() {
  const { courseId, moduleId } = useParams()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getModuleAssessments(courseId, moduleId)
      .then((assessments) => {
        const quizAssessment = assessments.find((a) => a.type === 'quiz')
        const assignmentAssessment = assessments.find((a) => a.type === 'assignment')
        setQuiz(quizAssessment)
        setAssignment(assignmentAssessment)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [courseId, moduleId])

  const selectAnswer = (questionId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
  }

  const handleSubmit = async () => {
    setError('')
    if (!quiz) return
    const unanswered = quiz.questions.filter((q) => !answers[q.id])
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining).`)
      return
    }
    setSubmitting(true)
    try {
      const res = await submitQuiz(courseId, moduleId, quiz.id, answers)
      setResult(res)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-center text-slate-400 py-20">Loading quiz…</p>
  if (error && !quiz) return <p className="text-center text-rose-600 py-20">{error}</p>

  return (
    <div>
    <TopBar searchPlaceholder="Search for anything..." />
    <div className="max-w-2xl mx-auto px-6 py-10">
      <Link to={`/courses/${courseId}`} className="text-sm text-brand-600 mb-4 inline-block">← Back to course</Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Module quiz</h1>

      {result ? (
        <div className="card p-6 animate-fadeIn">
          <p className="text-4xl font-bold text-brand-600 mb-1">{result.score}%</p>
          <p className="text-sm text-slate-500 mb-5">{result.correct} of {result.total} correct</p>

          <div className="space-y-3">
            {result.feedback.map((f) => (
              <div key={f.id} className={`p-3 rounded-lg border text-sm ${f.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                <p className="font-medium">{f.correct ? '✓ Correct' : '✗ Incorrect'} — answer: {f.correct_answer.toUpperCase()}</p>
                <p className="text-slate-600 mt-1">{f.explanation}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={() => navigate(`/courses/${courseId}`)} className="btn-primary">Continue course</button>
            {result.score < 60 && (
              <p className="text-xs text-slate-500 self-center">
                Scored below 60%? Use "Improve this module" on the course page to regenerate clearer content.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {quiz?.questions?.map((q, idx) => (
            <div key={q.id} className="card p-5 mb-4">
              <p className="font-medium text-slate-900 mb-3">{idx + 1}. {q.question}</p>
              <div className="space-y-2">
                {Object.entries(q.options).map(([key, text]) => (
                  <button
                    key={key}
                    onClick={() => selectAnswer(q.id, key)}
                    className={`w-full text-left text-sm px-3.5 py-2.5 rounded-lg border transition-colors ${
                      answers[q.id] === key ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="font-medium mr-2">{key.toUpperCase()}.</span>{text}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {assignment?.assignment && (
            <div className="card p-5 mb-4 bg-slate-50">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Assignment (for practice)</p>
              <p className="font-medium text-slate-900 mb-1">{assignment.assignment.title}</p>
              <p className="text-sm text-slate-600">{assignment.assignment.instructions}</p>
            </div>
          )}

          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'Submitting…' : 'Submit quiz'}
          </button>
        </>
      )}
    </div>
    </div>
  )
}
