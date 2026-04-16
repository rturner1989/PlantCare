import {
  faCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

/**
 * Toast — individual flash message card. Rendered by ToastContainer; consumers
 * don't use Toast directly, they call useToast() from ToastContext.
 *
 * Kind → visual mapping (Rails flash equivalents):
 *   success → emerald accent, check icon        (flash[:notice])
 *   error   → coral accent, exclamation-circle  (flash[:alert])
 *   warning → sunshine accent, triangle         (flash[:warning])
 *   info    → forest accent, info-circle        (flash[:info])
 *
 * Accessibility:
 *   Error toasts use role="alert" + aria-live="assertive" so screen readers
 *   interrupt to announce them immediately. Other kinds use role="status" +
 *   aria-live="polite" so they're announced without interrupting ongoing speech.
 */

// Base classes — tight 5px corners. Two kind-colored decorations:
//   1. A full-height vertical accent bar flush against the left edge, rendered
//      via ::before with `left-0 top-0 bottom-0` (no insets, no rounded corners
//      — the container's `overflow-hidden` + `rounded-xs` clips the bar's
//      corners cleanly to follow the card edge).
//   2. A circle-badge wrapping the kind icon (handled in the JSX body with a
//      soft tinted background matching the accent colour).
// Container is `relative` so the absolute children position against it.
const BASE =
  'relative overflow-hidden flex items-start gap-3 pl-5 pr-4 py-4 bg-card rounded-xs shadow-[var(--shadow-md)] w-full sm:w-auto sm:min-w-[280px] sm:max-w-[360px] before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5'

const KIND_STYLES = {
  success: {
    accent: 'before:bg-emerald',
    progress: 'bg-emerald',
    iconBg: 'bg-emerald/15',
    icon: faCheck,
    iconColor: 'text-emerald',
    role: 'status',
    ariaLive: 'polite',
  },
  error: {
    accent: 'before:bg-coral',
    progress: 'bg-coral',
    iconBg: 'bg-coral/15',
    icon: faCircleExclamation,
    iconColor: 'text-coral',
    role: 'alert',
    ariaLive: 'assertive',
  },
  warning: {
    accent: 'before:bg-sunshine',
    progress: 'bg-sunshine',
    iconBg: 'bg-sunshine/15',
    icon: faTriangleExclamation,
    iconColor: 'text-sunshine',
    role: 'status',
    ariaLive: 'polite',
  },
  info: {
    accent: 'before:bg-forest',
    progress: 'bg-forest',
    iconBg: 'bg-forest/15',
    icon: faCircleInfo,
    iconColor: 'text-forest',
    role: 'status',
    ariaLive: 'polite',
  },
}

function Toast({ id, kind, message, duration, onDismiss }) {
  const styles = KIND_STYLES[kind] ?? KIND_STYLES.info
  const showProgress = duration > 0

  return (
    <div role={styles.role} aria-live={styles.ariaLive} className={`${BASE} ${styles.accent}`}>
      <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center shrink-0`}>
        <FontAwesomeIcon icon={styles.icon} className={`${styles.iconColor} w-4 h-4`} />
      </div>
      <div className="flex-1 text-sm font-semibold text-ink pt-1.5">{message}</div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        className="text-ink-soft hover:text-ink transition-colors cursor-pointer border-0 bg-transparent p-0 pt-1.5"
      >
        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
      </button>

      {showProgress && (
        <div
          aria-hidden="true"
          className={`absolute bottom-0 left-0 w-full h-1 ${styles.progress} toast-progress`}
          style={{ '--toast-duration': `${duration}ms` }}
        />
      )}
    </div>
  )
}

/**
 * ToastContainer — fixed top-right stack of active toasts. Rendered internally
 * by ToastProvider.
 *
 * Uses `pointer-events-none` on the outer stack so the invisible container
 * area doesn't block clicks on the page below; each toast gets
 * `pointer-events-auto` so its dismiss button still works.
 *
 * Enter/exit animation via Framer Motion (`motion/react`):
 *   - Enter: fade in + subtle scale up from 0.92, 200ms easeOut
 *   - Exit:  fade out + bubble-expand to scale 1.08, 250ms easeOut
 *   - The `layout` prop smoothly slides remaining toasts up when one in the
 *     middle of the stack is dismissed, instead of a jump-cut.
 *   - `useReducedMotion()` strips the scale effect for motion-sensitive users,
 *     leaving just a plain fade.
 */
export default function ToastContainer({ toasts, onDismiss }) {
  const shouldReduceMotion = useReducedMotion()

  const motionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.08 },
        transition: { duration: 0.25, ease: 'easeOut' },
      }

  return (
    <div className="fixed top-[max(1rem,calc(env(safe-area-inset-top)+0.5rem))] right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 sm:items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((toastItem) => (
          <motion.div key={toastItem.id} layout className="pointer-events-auto" {...motionProps}>
            <Toast
              id={toastItem.id}
              kind={toastItem.kind}
              message={toastItem.message}
              duration={toastItem.duration}
              onDismiss={onDismiss}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
