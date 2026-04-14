import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import ToastContainer from '../components/ui/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idCounter = useRef(0)

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(({ kind = 'info', message, duration = 4000, persist = false }) => {
    const id = idCounter.current++
    // `effectiveDuration` is what the Toast component uses to drive its
    // progress bar animation. For persistent toasts we pass 0 so the bar
    // isn't rendered at all.
    const effectiveDuration = persist ? 0 : duration
    setToasts((current) => [...current, { id, kind, message, duration: effectiveDuration }])

    if (!persist && duration > 0) {
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const toast = useMemo(
    () => ({
      show: showToast,
      dismiss: dismissToast,
      success: (message, options = {}) => showToast({ ...options, kind: 'success', message }),
      error: (message, options = {}) => showToast({ ...options, kind: 'error', message }),
      warning: (message, options = {}) => showToast({ ...options, kind: 'warning', message }),
      info: (message, options = {}) => showToast({ ...options, kind: 'info', message }),
    }),
    [showToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
