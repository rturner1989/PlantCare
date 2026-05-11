import { Component } from 'react'

// Class component because error boundaries still need
// componentDidCatch + getDerivedStateFromError — no hook equivalent in
// React 19. Caller passes key={location.pathname} to reset on nav.
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
