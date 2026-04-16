import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiDelete, apiPost, setAccessToken } from '../api/client'

export const AuthContext = createContext(null)

// Session hint — a non-sensitive boolean in localStorage that tells us
// whether this browser has ever successfully logged in / is still holding a
// session. The real refresh token stays in the httpOnly cookie where JS can't
// touch it; the hint only controls whether we bother probing `/api/v1/token`
// on mount, so anonymous page loads don't produce a noisy 401 in DevTools.
const SESSION_HINT_KEY = 'plantcare:session-hint'

function hasSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === 'true'
  } catch {
    // localStorage may be unavailable (incognito quota, SSR, disabled cookies)
    return false
  }
}

function setSessionHint(value) {
  try {
    if (value) {
      localStorage.setItem(SESSION_HINT_KEY, 'true')
    } else {
      localStorage.removeItem(SESSION_HINT_KEY)
    }
  } catch {
    // fail silently
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/token', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        setUser(null)
        setAccessToken(null)
        setSessionHint(false)
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

      setSessionHint(false)
      return false
    } catch {
      setUser(null)
      setAccessToken(null)
      setSessionHint(false)
      return false
    }
  }, [])

  // On mount: only attempt to restore session if we have a hint that one
  // exists. Skips the refresh probe entirely for fresh visitors and
  // post-logout visitors, avoiding the 401 noise in DevTools.
  useEffect(() => {
    if (!hasSessionHint()) {
      setLoading(false)
      return
    }
    refreshToken().finally(() => setLoading(false))
  }, [refreshToken])

  // login/register throw on failure — callers are responsible for displaying
  // the error (via the toast context, typically). Keeping this context focused
  // on auth state (user + loading) rather than UI state (errors).
  const login = useCallback(async (email, password) => {
    const data = await apiPost('/api/v1/session', { session: { email, password } })
    setAccessToken(data.access_token)
    setUser(data.user)
    setSessionHint(true)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password, passwordConfirmation) => {
    const data = await apiPost('/api/v1/registration', {
      user: { name, email, password, password_confirmation: passwordConfirmation },
    })
    setAccessToken(data.access_token)
    setUser(data.user)
    setSessionHint(true)
    return data.user
  }, [])

  const markOnboarded = useCallback(async () => {
    const updatedUser = await apiPost('/api/v1/onboarding/completion', {})
    setUser(updatedUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiDelete('/api/v1/session')
    } catch {
      // Logout endpoint may fail if token is already expired — that is fine
    } finally {
      setAccessToken(null)
      setUser(null)
      setSessionHint(false)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshToken, markOnboarded }),
    [user, loading, login, register, logout, refreshToken, markOnboarded],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
