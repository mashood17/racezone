import { useState } from 'react'

export const useAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem('rz_token'))
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('rz_user')
    return u ? JSON.parse(u) : null
  })

  const login = (tokenValue, userData) => {
    localStorage.setItem('rz_token', tokenValue)
    localStorage.setItem('rz_user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('rz_token')
    localStorage.removeItem('rz_user')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!token

  return { token, user, login, logout, isAuthenticated }
}