import { useRef } from 'react'

const STORAGE_KEY = 'plantcare_tour_pending'

export function useFirstRunReveal() {
  const resultRef = useRef(null)

  if (resultRef.current === null) {
    const pending = typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === 'true'
    if (pending) window.localStorage.removeItem(STORAGE_KEY)
    resultRef.current = { isFirstRun: pending }
  }

  return resultRef.current
}
