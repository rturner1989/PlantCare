import { motion, useReducedMotion } from 'motion/react'
import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Dock from '../components/Dock'
import Sidebar from '../components/Sidebar'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useFirstRunReveal } from '../hooks/useFirstRunReveal'

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50dvh]">
      <Spinner />
    </div>
  )
}

export default function AppLayout() {
  const mainRef = useRef(null)
  const location = useLocation()
  const previousPathRef = useRef(location.pathname)

  const { isFirstRun } = useFirstRunReveal()
  const { user } = useAuth()
  const toast = useToast()
  const shouldReduceMotion = useReducedMotion()
  // Strict Mode double-invokes the toast effect in dev; the ref guard
  // keeps a single welcome toast regardless of how many times the effect
  // fires against the same mount.
  const welcomeToastFiredRef = useRef(false)

  // Move focus to <main> on every route change so screen-reader users hear
  // the new page's context instead of dead silence after a NavLink click.
  // previousPathRef starts seeded with the initial pathname so the first
  // render's effect run is a no-op (no focus steal on mount). Subsequent
  // changes update the ref and focus main.
  useEffect(() => {
    if (previousPathRef.current === location.pathname) return
    previousPathRef.current = location.pathname
    mainRef.current?.focus()
  }, [location.pathname])

  useEffect(() => {
    if (!isFirstRun || !user || welcomeToastFiredRef.current) return
    welcomeToastFiredRef.current = true
    const firstName = user.name?.split(' ')[0] ?? 'there'
    toast.info(`Welcome, ${firstName} 🌿`)
  }, [isFirstRun, user, toast])

  const animateMain = isFirstRun && !shouldReduceMotion

  return (
    <div className="min-h-dvh">
      {/* Skip link — first focusable element on the page. Appears on focus
          so keyboard users can jump past the Sidebar/Dock without Tabbing
          through every nav item first. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-forest focus:text-card focus:rounded-md focus:shadow-lg focus:no-underline"
      >
        Skip to main content
      </a>

      <Sidebar isFirstRun={isFirstRun} />

      {animateMain ? (
        <motion.main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="lg:ml-[260px] pt-[env(safe-area-inset-top)] pb-24 lg:pt-0 lg:pb-0 min-h-dvh flex flex-col focus:outline-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.15 }}
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </motion.main>
      ) : (
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="lg:ml-[260px] pt-[env(safe-area-inset-top)] pb-24 lg:pt-0 lg:pb-0 min-h-dvh flex flex-col focus:outline-none"
        >
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
      )}

      <Dock isFirstRun={isFirstRun} />
    </div>
  )
}
