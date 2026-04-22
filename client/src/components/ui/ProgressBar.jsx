import { useIsFetching } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

// Thin top-of-viewport loading indicator. Tied to TanStack Query's global
// isFetching count — any query in flight shows the bar. Lingers briefly
// after the count returns to zero so the "finished" flash is visible.
export default function ProgressBar() {
  const fetching = useIsFetching()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (fetching > 0) {
      setVisible(true)
      return
    }
    const timer = setTimeout(() => setVisible(false), 260)
    return () => clearTimeout(timer)
  }, [fetching])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className="fixed top-0 left-0 right-0 h-[3px] z-[55] bg-mint overflow-hidden pointer-events-none"
    >
      <div className="h-full w-1/4 bg-leaf progress-bar-sweep" />
    </div>
  )
}
