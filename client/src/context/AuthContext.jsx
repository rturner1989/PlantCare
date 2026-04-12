import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiPost, apiDelete, setAccessToken } from '../api/client'

export const AuthContext = createContext();

export const useAuthContext = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/token', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        setUser(null)
        setAccessToken(null)
        return false
      }

      const data = await response.json()
      setAccessToken(data.access_token)

      // Fetch user profile with the new token
      const profileResponse = await fetch('/api/v1/profile', {
        headers: { Authorization: `Bearer ${data.access_token}` },
        credentials: 'include',
      })

      if (profileResponse.ok) {
        const userData = await profileResponse.json()
        setUser(userData)
        return true
      }

      return false
    } catch {
      setUser(null)
      setAccessToken(null)
      return false
    }
  }, [])

  // On mount: attempt to restore session from refresh cookie
  useEffect(() => {
    refreshToken().finally(() => setLoading(false))
  }, [refreshToken])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const data = await apiPost('/api/v1/session', { session: { email, password } })
      setAccessToken(data.access_token)
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err
    }
  }, [])

  const register = useCallback(async (name, email, password, passwordConfirmation) => {
    setError(null)
    try {
      const data = await apiPost('/api/v1/registration', {
        user: { name, email, password, password_confirmation: passwordConfirmation },
      })
      setAccessToken(data.access_token)
      setUser(data.user)
      return data.user
    } catch (err) {
      setError(err.message || 'Registration failed')
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiDelete('/api/v1/session')
    } catch {
      // Logout endpoint may fail if token is already expired — that is fine
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, error, login, register, logout, refreshToken, setError }),
    [user, loading, error, login, register, logout, refreshToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
};
