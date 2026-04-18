import {
  faCheck,
  faCircleExclamation,
  faCircleInfo,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Action from './Action'

// Consumers use useToast() from ToastContext — Toast is rendered by
// ToastContainer below. Error toasts use role="alert" + aria-live="assertive"
// so screen readers interrupt; other kinds use polite status.
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
    iconColor: 'text-coral-deep',
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
      <Action
        variant="unstyled"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        className="text-ink-soft hover:text-ink transition-colors p-0 pt-1.5"
      >
        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
      </Action>

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
