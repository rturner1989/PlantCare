import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import ToastContainer from '../components/ui/Toast'

const ToastContext = createContext(null)

const KIND_DURATIONS = {
  success: 4000,
  warn: 7000,
  info: 5000,
  undo: 6000,
  error: 0,
  loading: 0,
}

const STACK_LIMIT = 3
const STICKY_KINDS = new Set(['error', 'loading'])

function normalize(stringOrOptions, extraOptions) {
  if (typeof stringOrOptions === 'string') {
    return { ...(extraOptions ?? {}), title: stringOrOptions }
  }
  return stringOrOptions ?? {}
}

function durationFor(kind, override) {
  if (override !== undefined) return override
  return KIND_DURATIONS[kind] ?? 0
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idCounterRef = useRef(0)
  const timersRef = useRef(new Map())

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const removeToast = useCallback(
    (id) => {
      clearTimer(id)
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id))
    },
    [clearTimer],
  )

  const scheduleAutoDismiss = useCallback(
    (id, duration) => {
      clearTimer(id)
      if (!duration || duration <= 0) return
      const timer = setTimeout(() => {
        timersRef.current.delete(id)
        setToasts((current) => current.filter((toastItem) => toastItem.id !== id))
      }, duration)
      timersRef.current.set(id, timer)
    },
    [clearTimer],
  )

  const showToast = useCallback(
    (options) => {
      const { kind = 'info', title, meta, action } = options
      const duration = durationFor(kind, options.duration)
      const id = idCounterRef.current++
      const incoming = { id, kind, title, meta, action, duration }

      setToasts((current) => {
        const next = [...current, incoming]
        if (next.length <= STACK_LIMIT) return next
        // Stack at cap — trim oldest non-sticky toast. Errors + loading
        // toasts are exempt so the user never loses an unresolved problem
        // message to a flood of background success pings.
        const trimIndex = next.findIndex((toastItem) => !STICKY_KINDS.has(toastItem.kind))
        if (trimIndex === -1) return next
        clearTimer(next[trimIndex].id)
        return next.filter((_, index) => index !== trimIndex)
      })

      scheduleAutoDismiss(id, duration)
      return id
    },
    [scheduleAutoDismiss, clearTimer],
  )

  const resolveToast = useCallback(
    (id, options) => {
      const opts = normalize(options)
      const kind = opts.kind ?? 'success'
      const duration = durationFor(kind, opts.duration)
      setToasts((current) =>
        current.map((toastItem) =>
          toastItem.id === id
            ? {
                ...toastItem,
                kind,
                title: opts.title ?? toastItem.title,
                meta: opts.meta,
                action: opts.action,
                duration,
              }
            : toastItem,
        ),
      )
      scheduleAutoDismiss(id, duration)
    },
    [scheduleAutoDismiss],
  )

  const fireKind = useCallback(
    (kind) => (stringOrOptions, extraOptions) => {
      const opts = normalize(stringOrOptions, extraOptions)
      return showToast({ ...opts, kind })
    },
    [showToast],
  )

  const toast = useMemo(
    () => ({
      show: (stringOrOptions, extraOptions) => showToast(normalize(stringOrOptions, extraOptions)),
      dismiss: removeToast,
      resolve: resolveToast,
      success: fireKind('success'),
      error: fireKind('error'),
      warn: fireKind('warn'),
      warning: fireKind('warn'),
      info: fireKind('info'),
      undo: fireKind('undo'),
      loading: fireKind('loading'),
    }),
    [showToast, removeToast, resolveToast, fireKind],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
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
