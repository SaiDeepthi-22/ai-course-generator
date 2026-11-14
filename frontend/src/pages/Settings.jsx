import React, { useState } from 'react'
import TopBar from '../components/TopBar'
import { useAuth } from '../api/AuthContext'
import { updateProfile } from '../api/client'

const DEFAULT_PREFS_KEY = 'course_defaults'

function loadDefaults() {
  try {
    return JSON.parse(localStorage.getItem(DEFAULT_PREFS_KEY)) || { difficulty: 'beginner', duration: '1 week' }
  } catch {
    return { difficulty: 'beginner', duration: '1 week' }
  }
}

export default function Settings() {
  const { userName, updateName } = useAuth()

  // Profile
  const [name, setName] = useState(userName || '')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [nameErr, setNameErr] = useState('')

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')

  // Default course preferences (used to prefill Generate Course / Home hero form)
  const [prefs, setPrefs] = useState(loadDefaults())
  const [prefsSaved, setPrefsSaved] = useState(false)

  const handleSaveName = async (e) => {
    e.preventDefault()
    setNameErr(''); setNameMsg('')
    if (!name.trim()) { setNameErr('Name cannot be empty.'); return }
    setSavingName(true)
    try {
      await updateProfile({ name: name.trim() })
      updateName(name.trim())
      setNameMsg('Name updated.')
    } catch (err) {
      setNameErr(err.message)
    } finally {
      setSavingName(false)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    setPwErr(''); setPwMsg('')
    if (!currentPassword || !newPassword) { setPwErr('Fill in both password fields.'); return }
    if (newPassword.length < 6) { setPwErr('New password must be at least 6 characters.'); return }
    if (newPassword !== confirmPassword) { setPwErr('New passwords do not match.'); return }
    setSavingPassword(true)
    try {
      await updateProfile({ current_password: currentPassword, new_password: newPassword })
      setPwMsg('Password updated.')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      setPwErr(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSavePrefs = () => {
    localStorage.setItem(DEFAULT_PREFS_KEY, JSON.stringify(prefs))
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2000)
  }

  return (
    <div>
      <TopBar searchPlaceholder="Search for anything..." />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile, password, and course defaults.</p>
        </div>

        {/* Profile */}
        <form onSubmit={handleSaveName} className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Profile</h2>
          <label className="text-xs text-slate-400 mb-1 block">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field mb-3" />
          {nameErr && <p className="text-sm text-rose-600 mb-2">{nameErr}</p>}
          {nameMsg && <p className="text-sm text-emerald-600 mb-2">{nameMsg}</p>}
          <button type="submit" disabled={savingName} className="btn-primary text-sm px-4">
            {savingName ? 'Saving…' : 'Save name'}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={handleSavePassword} className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Change password</h2>
          <label className="text-xs text-slate-400 mb-1 block">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-field mb-3" />
          <label className="text-xs text-slate-400 mb-1 block">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field mb-3" />
          <label className="text-xs text-slate-400 mb-1 block">Confirm new password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field mb-3" />
          {pwErr && <p className="text-sm text-rose-600 mb-2">{pwErr}</p>}
          {pwMsg && <p className="text-sm text-emerald-600 mb-2">{pwMsg}</p>}
          <button type="submit" disabled={savingPassword} className="btn-primary text-sm px-4">
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>

        {/* Course defaults */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Course defaults</h2>
          <p className="text-xs text-slate-400 mb-4">Used to pre-fill the difficulty and duration whenever you generate a new course.</p>

          <label className="text-xs text-slate-400 mb-1 block">Default difficulty</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['beginner', 'intermediate', 'advanced'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, difficulty: d }))}
                className={`text-sm px-3 py-2 rounded-lg border capitalize transition-colors ${
                  prefs.difficulty === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <label className="text-xs text-slate-400 mb-1 block">Default duration</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {['3 hours', '1 week', '2 weeks', '1 month'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, duration: d }))}
                className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                  prefs.duration === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button onClick={handleSavePrefs} className="btn-secondary text-sm px-4">
            {prefsSaved ? 'Saved ✓' : 'Save defaults'}
          </button>
        </div>
      </div>
    </div>
  )
}
