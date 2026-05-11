import { Component } from 'react'

/**
 * React error boundary — catches render-time exceptions in descendants
 * and renders a fallback instead of blanking the page.
 *
 * `fallback` can be either:
 *   - A ReactNode rendered as-is when an error is caught
 *   - A function `({ error, reset }) => ReactNode` for fallbacks that
 *     want to inspect the error or expose a "try again" button
 *
 * Reset on route change is the caller's responsibility — pass
 * `key={location.pathname}` so the boundary remounts when the route
 * changes. Without it, the user stays trapped on the error screen
 * even after navigating elsewhere.
 *
 *   <ErrorBoundary
 *     key={location.pathname}
 *     fallback={({ reset }) => (
 *       <ErrorState
 *         scheme="500"
 *         title={<>Something <em>wobbled</em></>}
 *         actions={[<Action onClick={reset}>Try again</Action>]}
 *       />
 *     )}
 *   >
 *     <Outlet />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Logs to the browser console; an external reporter (Honeybadger /
    // Sentry / Bugsnag) would hook in here. Out of scope for now.
    if (typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary caught:', error, info)
    }
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const { fallback } = this.props
    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset })
    }
    return fallback ?? null
  }
}
