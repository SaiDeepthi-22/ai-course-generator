import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getCourse, getModule, getProgress, regenerateModule, completeCourse } from '../api/client'
import ModuleSidebar from '../components/ModuleSidebar'
import ProgressBar from '../components/ProgressBar'
import TutorChat from '../components/TutorChat'
import TopBar from '../components/TopBar'

export default function CourseView() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [activeModule, setActiveModule] = useState(null)
  const [moduleContent, setModuleContent] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [moduleLoading, setModuleLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [error, setError] = useState('')

  const loadProgress = useCallback(() => {
    getProgress(courseId).then(setProgress).catch(() => {})
  }, [courseId])

  useEffect(() => {
    setLoading(true)
    getCourse(courseId)
      .then((c) => {
        setCourse(c)
        if (c.modules.length > 0) setActiveModule(c.modules[0])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    loadProgress()
  }, [courseId, loadProgress])

  useEffect(() => {
    if (!activeModule) return
    setModuleLoading(true)
    setError('')
    getModule(courseId, activeModule.id)
      .then(setModuleContent)
      .catch((e) => setError(e.message))
      .finally(() => setModuleLoading(false))
  }, [activeModule, courseId])

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const updated = await regenerateModule(courseId, activeModule.id)
      setModuleContent(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  const handleCompleteCourse = async () => {
    await completeCourse(courseId)
    navigate(`/courses/${courseId}/complete`)
  }

  if (loading) return <p className="text-center text-slate-400 py-20">Loading course…</p>
  if (error && !course) return <p className="text-center text-rose-600 py-20">{error}</p>
  if (!course) return null

  const completedIds = new Set(course.modules.filter((m) => m.is_completed).map((m) => m.id))
  const allModulesGenerated = course.modules.every((m) => m.is_generated || m.id === activeModule?.id)

  return (
    <div>
    <TopBar searchPlaceholder="Search for anything..." />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{course.title || course.topic}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">{course.description}</p>
        {progress && (
          <div className="max-w-sm mt-4">
            <ProgressBar percent={progress.percent_complete} label="Course progress" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <ModuleSidebar
          modules={course.modules}
          activeModuleId={activeModule?.id}
          onSelect={setActiveModule}
          completedIds={completedIds}
        />

        <div className="card p-6 min-h-[300px]">
          {moduleLoading && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                <p className="text-sm text-slate-500">Generating this module with AI — this can take a bit on local models…</p>
              </div>
              <div className="space-y-3">
                <div className="h-5 bg-slate-100 rounded-md w-2/3 animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded-md w-full animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded-md w-11/12 animate-pulse" />
                <div className="h-3.5 bg-slate-100 rounded-md w-4/5 animate-pulse" />
                <div className="h-24 bg-slate-100 rounded-lg w-full animate-pulse mt-4" />
                <div className="h-3.5 bg-slate-100 rounded-md w-3/4 animate-pulse mt-4" />
                <div className="h-3.5 bg-slate-100 rounded-md w-2/3 animate-pulse" />
              </div>
            </div>
          )}
          {error && !moduleLoading && <p className="text-rose-600 text-sm mb-4">{error}</p>}

          {moduleContent && !moduleLoading && (
            <>
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{moduleContent.title}</h2>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                  title="Regenerate this module with clearer explanations"
                >
                  {regenerating ? 'Improving…' : '↻ Improve this module'}
                </button>
              </div>

              {moduleContent.objectives?.length > 0 && (
                <ul className="text-sm text-slate-500 mb-5 list-disc ml-5 space-y-0.5">
                  {moduleContent.objectives.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              )}

              <div className="prose-content">
                <ReactMarkdown>{moduleContent.content_md}</ReactMarkdown>
              </div>

              {moduleContent.examples?.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-slate-900">Examples</h3>
                  {moduleContent.examples.map((ex, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-800 mb-1">{ex.title}</p>
                      {ex.type === 'code' ? (
                        <div className="relative group">
                          <pre className="bg-slate-900 text-slate-100 text-sm p-3 rounded-lg overflow-x-auto">
                            <code>{ex.code}</code>
                          </pre>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ex.code)
                              setCopiedIndex(i)
                              setTimeout(() => setCopiedIndex(null), 1500)
                            }}
                            className="absolute top-2 right-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedIndex === i ? 'Copied ✓' : 'Copy'}
                          </button>
                        </div>
                      ) : null}
                      <p className="text-sm text-slate-600 mt-2">{ex.explanation}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex items-center gap-3">
                <button
                  onClick={() => navigate(`/courses/${courseId}/modules/${activeModule.id}/quiz`)}
                  className="btn-primary"
                >
                  Take quiz for this module
                </button>
                {allModulesGenerated && (
                  <button onClick={handleCompleteCourse} className="btn-secondary">
                    Mark course as complete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <TutorChat courseId={Number(courseId)} moduleId={activeModule?.id} />
    </div>
    </div>
  )
}
