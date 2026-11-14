import React, { createContext, useContext, useState, useEffect } from 'react'
import { setToken, clearToken } from './client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [userName, setUserName] = useState(localStorage.getItem('user_name') || null)

  const login = (token, name) => {
    setToken(token)
    localStorage.setItem('user_name', name)
    setUserName(name)
  }

  const logout = () => {
    clearToken()
    localStorage.removeItem('user_name')
    setUserName(null)
  }

  const updateName = (name) => {
    localStorage.setItem('user_name', name)
    setUserName(name)
  }

  // client.js dispatches this whenever any API call comes back 401, so a
  // stale/expired session can't leave the UI showing "logged in" while
  // every request silently fails with no auth header.
  useEffect(() => {
    const handleForcedLogout = () => logout()
    window.addEventListener('auth:logout', handleForcedLogout)
    return () => window.removeEventListener('auth:logout', handleForcedLogout)
  }, [])

  return (
    <AuthContext.Provider value={{ userName, isAuthenticated: !!userName, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
