import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute — auth + onboarding gate for app routes.
 *
 * Three checks, in order:
 *   1. While the AuthContext is still restoring a session (loading), render
 *      a spinner so we don't flash the destination then bounce.
 *   2. If the user isn't authenticated, redirect to /login with the
 *      requested path stashed in `state.from` so post-login can return.
 *   3. If `requireOnboarded` is true (the default) and the user hasn't
 *      finished the onboarding wizard, redirect to /welcome. Wrap the
 *      Welcome route itself with `requireOnboarded={false}` so it stays
 *      reachable for the un-onboarded users that need to *complete* it.
 */
export default function ProtectedRoute({ children, requireOnboarded = true }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-3 border-leaf border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireOnboarded && !user.onboarded) {
    return <Navigate to="/welcome" replace />
  }

  return children
}
