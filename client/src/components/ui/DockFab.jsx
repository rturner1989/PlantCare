import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Action from './Action'

const SIZES = {
  md: { fab: 56, action: 56, actionIcon: 22, spread: 60, baseLift: 60, archBoost: 12 },
}

// Arch positioning — actions fan up from the FAB. X is evenly spread
// left-to-right. Y is a base lift that puts every action clearly above
// the dock chrome, plus a gentle quadratic boost for the centre item
// so the row reads as a flat hill rather than a steep mountain.
function archPosition(index, count, dimensions) {
  const mid = (count - 1) / 2
  const offset = index - mid
  const x = offset * dimensions.spread
  const t = mid === 0 ? 0 : offset / mid
  const archComponent = dimensions.archBoost * (1 - t * t)
  const y = -(dimensions.baseLift + archComponent)
  return { x, y }
}

// Stagger from centre outward — middle action arrives first, edges last.
function archStaggerDelay(index, count) {
  const mid = (count - 1) / 2
  return Math.abs(index - mid) * 0.04
}

const ARROW_DELTA = { ArrowRight: 1, ArrowLeft: -1 }

export default function DockFab({
  centreLabel = 'Add',
  centreSlot = '+',
  closeIcon = '×',
  actions = [],
  onAction,
  size = 'md',
  className = '',
}) {
  const dimensions = SIZES[size] ?? SIZES.md
  const shouldReduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef(null)
  const fabRef = useRef(null)
  const actionRefs = useRef([])

  useEffect(() => {
    if (open) setFocusedIndex(0)
    else setFocusedIndex(-1)
  }, [open])

  useEffect(() => {
    if (!open || focusedIndex < 0) return
    actionRefs.current[focusedIndex]?.focus()
  }, [open, focusedIndex])

  useEffect(() => {
    if (!open) return
    function handlePointer(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        fabRef.current?.focus()
        return
      }
      const delta = ARROW_DELTA[event.key]
      if (delta === undefined) return
      event.preventDefault()
      setFocusedIndex((current) => (current + delta + actions.length) % actions.length)
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, actions.length])

  function handleFabClick() {
    setOpen((current) => !current)
  }

  function handleActionClick(action) {
    if (action.disabled) return
    onAction?.(action.id)
    setOpen(false)
  }

  // Portal the scrim to document.body so its `fixed` positioning is
  // viewport-rooted regardless of transformed ancestors. CSS `fixed`
  // falls back to the nearest transformed ancestor as containing block;
  // the dock anchor needs `transform` for centring, which would shrink
  // the scrim to the FAB's box if rendered inline.
  const scrim =
    open && typeof document !== 'undefined'
      ? createPortal(
          <AnimatePresence>
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-ink/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
            />
          </AnimatePresence>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {scrim}

      {/* Action ring — actions fan up in an arch. */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="actions"
            role="menu"
            aria-label={centreLabel}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: dimensions.fab + 8 }}
          >
            {actions.map((action, index) => {
              const { x, y } = archPosition(index, actions.length, dimensions)
              const delay = shouldReduceMotion ? 0 : archStaggerDelay(index, actions.length)
              const isDisabled = Boolean(action.disabled)

              return (
                <motion.div
                  key={action.id}
                  className="absolute left-1/2 bottom-0 -translate-x-1/2"
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.32,
                    delay,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <Action
                    ref={(node) => {
                      actionRefs.current[index] = node
                    }}
                    variant="unstyled"
                    disabled={isDisabled}
                    onClick={() => handleActionClick(action)}
                    onFocus={() => setFocusedIndex(index)}
                    aria-label={action.disabledReason ? `${action.label} (${action.disabledReason})` : action.label}
                    aria-disabled={isDisabled || undefined}
                    role="menuitem"
                    className="rounded-full flex flex-col items-center justify-center gap-0.5 bg-paper text-ink shadow-warm-md border border-paper-edge/60 transition-shadow hover:bg-mint hover:border-emerald/30 active:scale-95 disabled:cursor-not-allowed"
                    style={{ width: dimensions.action, height: dimensions.action }}
                  >
                    <span aria-hidden="true" style={{ fontSize: dimensions.actionIcon, lineHeight: 1 }}>
                      {action.icon}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.06em]">{action.label}</span>
                  </Action>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The FAB itself — toggle. */}
      <Action
        ref={fabRef}
        variant="unstyled"
        onClick={handleFabClick}
        aria-label={centreLabel}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-full bg-[image:var(--gradient-brand)] text-paper flex items-center justify-center text-2xl font-bold shadow-[var(--shadow-fab)] active:scale-95"
        style={{ width: dimensions.fab, height: dimensions.fab }}
      >
        <motion.span
          aria-hidden="true"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          className="leading-none"
        >
          {open ? closeIcon : centreSlot}
        </motion.span>
      </Action>
    </div>
  )
}
