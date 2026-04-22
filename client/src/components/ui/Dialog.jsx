import A11yDialog from 'a11y-dialog'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Dialog({ open, onClose, title, children, className = '' }) {
  const containerRef = useRef(null)
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!containerRef.current) return
    const instance = new A11yDialog(containerRef.current)
    dialogRef.current = instance
    instance.on('hide', () => {
      onCloseRef.current?.()
    })
    return () => {
      instance.destroy()
      dialogRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!dialogRef.current) return
    if (open) dialogRef.current.show()
    else dialogRef.current.hide()
  }, [open])

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-hidden="true"
      className="dialog"
    >
      <div className="dialog-overlay" data-a11y-dialog-hide />
      <div className="dialog-content" role="document">
        <div className={`dialog-card bg-card rounded-md shadow-[var(--shadow-md)] flex flex-col min-h-0 ${className}`}>
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
