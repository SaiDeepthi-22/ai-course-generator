import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './api/AuthContext'
import Navbar from './components/Navbar'
import AppShell from './components/AppShell'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import MyCourses from './pages/MyCourses'
import CreateCourse from './pages/CreateCourse'
import CourseView from './pages/CourseView'
import Quiz from './pages/Quiz'
import Completion from './pages/Completion'
import TutorPage from './pages/TutorPage'
import ProgressPage from './pages/ProgressPage'
import Bookmarks from './pages/Bookmarks'
import Settings from './pages/Settings'

// Public pages keep the simple top navbar (Landing, Login, Register).
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes — simple top navbar */}
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

        {/* Authenticated routes — sidebar + topbar shell (AppShell also enforces login) */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/courses" element={<MyCourses />} />
          <Route path="/create" element={<CreateCourse />} />
          <Route path="/courses/:courseId" element={<CourseView />} />
          <Route path="/courses/:courseId/modules/:moduleId/quiz" element={<Quiz />} />
          <Route path="/courses/:courseId/complete" element={<Completion />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
