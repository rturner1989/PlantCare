import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Dialog({ open, onClose, title, children, className = '' }) {
  const cardRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    previouslyFocusedRef.current = document.activeElement
    cardRef.current?.focus()

    function handleKey(event) {
      if (event.key === 'Escape') onCloseRef.current?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="dialog-root">
      <button
        type="button"
        aria-label="Close dialog"
        className="dialog-overlay"
        onClick={() => onCloseRef.current?.()}
      />
      <div className="dialog-content">
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          tabIndex={-1}
          className={`dialog-card bg-card rounded-md shadow-[var(--shadow-md)] flex flex-col min-h-0 ${className}`}
        >
          {title && (
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
