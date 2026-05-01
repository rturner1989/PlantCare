import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import Card from './Card'

const MotionCard = motion.create(Card)

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: 'easeOut' },
}

const desktopCardMotion = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: { duration: 0.22, ease: [0.33, 1, 0.68, 1] },
}

const mobileCardMotion = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
  transition: { duration: 0.26, ease: [0.33, 1, 0.68, 1] },
}

const rightDrawerMotion = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: 0.28, ease: [0.33, 1, 0.68, 1] },
}

function isMobileViewport() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 1023px)').matches
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  className = '',
  placement = 'center',
  scrim,
  cardVariant = 'solid',
}) {
  const isRight = placement === 'right'
  // Center placement defaults to a dimmed scrim. Right drawer defaults to
  // no scrim (Mac-notification-centre style — main content visible behind)
  // but stays click-to-close via a transparent overlay.
  const showScrim = scrim ?? !isRight
  const cardRef = useRef(null)
  const previouslyFocusedRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const dragControls = useDragControls()
  const isMobile = isMobileViewport()
  const cardMotion = isRight ? rightDrawerMotion : isMobile ? mobileCardMotion : desktopCardMotion
  const allowDrag = !isRight && isMobile

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    previouslyFocusedRef.current = document.activeElement
    cardRef.current?.focus()

    // Focus trap — Tab / Shift+Tab cycle within the dialog so keyboard
    // focus can't leak to background DOM while the modal is open.
    // WCAG 2.4.3 + WAI-ARIA APG modal pattern.
    function handleKey(event) {
      if (event.key === 'Escape') {
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const card = cardRef.current
      if (!card) return

      const focusable = card.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === card)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open])

  function handleDragEnd(_event, info) {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onCloseRef.current?.()
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="dialog-root">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className={showScrim ? 'dialog-overlay' : 'dialog-overlay dialog-overlay-transparent'}
            onClick={() => onCloseRef.current?.()}
            {...overlayMotion}
          />
          <div className={isRight ? 'dialog-content dialog-content-right' : 'dialog-content'}>
            <MotionCard
              ref={cardRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              variant={cardVariant}
              className={`shadow-[var(--shadow-md)] flex flex-col min-h-0 px-6 pt-2 pb-6 gap-4 sm:pt-6 ${className}`}
              drag={allowDrag ? 'y' : false}
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
              {...cardMotion}
            >
              {allowDrag && (
                <button
                  type="button"
                  aria-label="Drag to dismiss"
                  className="dialog-handle-wrapper"
                  onPointerDown={(event) => dragControls.start(event)}
                >
                  <span aria-hidden="true" className="dialog-handle" />
                </button>
              )}
              {title && (
                <h2 id={titleId} className="sr-only">
                  {title}
                </h2>
              )}
              {children}
            </MotionCard>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
