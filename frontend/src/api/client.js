// Central place for every backend call. Keeping fetch logic here (instead of
// scattered through components) means the token handling and error handling
// only need to be written once.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('access_token')
}

export function setToken(token) {
  localStorage.setItem('access_token', token)
}

export function clearToken() {
  localStorage.removeItem('access_token')
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let detail = 'Something went wrong. Please try again.'
    try {
      const body = await res.json()
      if (Array.isArray(body.detail)) {
        // FastAPI's built-in validation errors (422) return an array of
        // {loc, msg, type} objects instead of a plain string — join their
        // messages into something readable instead of stringifying objects.
        detail = body.detail.map((d) => d.msg).join(' ')
      } else if (typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      /* response wasn't JSON — keep default message */
    }
    if (res.status === 401) {
      clearToken()
      // Tell the rest of the app the session is gone, not just the token —
      // without this, a stale username stays visible in the sidebar while
      // every subsequent request silently goes out with no Authorization
      // header at all, producing an infinite loop of "Not authenticated".
      window.dispatchEvent(new Event('auth:logout'))
    }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

// ---------- Auth ----------
export const registerUser = (name, email, password) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })

export const loginUser = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })

export const updateProfile = (payload) =>
  request('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) })

// ---------- Courses ----------
export const createCourse = (topic, difficulty, duration, learning_goal) =>
  request('/courses', { method: 'POST', body: JSON.stringify({ topic, difficulty, duration, learning_goal }) })

export const listCourses = () => request('/courses')

export const getCourse = (courseId) => request(`/courses/${courseId}`)

export const getModule = (courseId, moduleId) => request(`/courses/${courseId}/modules/${moduleId}`)

export const getModuleAssessments = (courseId, moduleId) =>
  request(`/courses/${courseId}/modules/${moduleId}/assessments`)

export const submitQuiz = (courseId, moduleId, assessmentId, answers) =>
  request(`/courses/${courseId}/modules/${moduleId}/quiz`, {
    method: 'POST',
    body: JSON.stringify({ assessment_id: assessmentId, answers }),
  })

export const regenerateModule = (courseId, moduleId) =>
  request(`/courses/${courseId}/modules/${moduleId}/regenerate`, { method: 'POST' })

export const completeCourse = (courseId) => request(`/courses/${courseId}/complete`, { method: 'POST' })

// ---------- Tutor ----------
export const sendTutorMessage = (courseId, moduleId, message) =>
  request('/tutor/chat', { method: 'POST', body: JSON.stringify({ course_id: courseId, module_id: moduleId, message }) })

export const getTutorHistory = (courseId) => request(`/tutor/history/${courseId}`)

// ---------- Progress ----------
export const getProgress = (courseId) => request(`/progress/${courseId}`)
