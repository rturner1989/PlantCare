import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Dock from '../components/Dock'
import Sidebar from '../components/Sidebar'

export default function AppLayout() {
  const mainRef = useRef(null)
  const location = useLocation()
  const isFirstRenderRef = useRef(true)

  // Move focus to <main> on every route change so screen-reader users hear
  // the new page's context instead of dead silence after a NavLink click.
  // Skip the first render so we don't steal focus on initial mount from
  // whatever triggered navigation (typically the login form unmounting).
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }
    mainRef.current?.focus()
  }, [location.pathname])

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

      <Sidebar />

      <main
        ref={mainRef}
        id="main-content"
        tabIndex={-1}
        className="lg:ml-[260px] pt-[env(safe-area-inset-top)] pb-24 lg:pt-0 lg:pb-0 min-h-dvh focus:outline-none"
      >
        <Outlet />
      </main>

      <Dock />
    </div>
  )
}
