import { createContext, useContext, useState, useCallback } from 'react'
import { loginRequest } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser]   = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Realiza a chamada ao backend, armazena token e retorna a role
  const login = useCallback(async (email, password) => {
    const { data } = await loginRequest(email, password)
    const payload  = JSON.parse(atob(data.token.split('.')[1]))
    const userData = { id: payload.sub, email: payload.email, role: payload.role }

    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(data.token)
    setUser(userData)

    return userData.role
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
