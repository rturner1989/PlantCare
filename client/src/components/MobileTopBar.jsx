import { faBell } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import Action from './ui/Action'
import Avatar from './ui/Avatar'

const barVariants = {
  hidden: { y: -100 },
  visible: {
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export default function MobileTopBar({ isFirstRun = false }) {
  const { user } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = isFirstRun && !shouldReduceMotion

  return (
    <motion.div
      className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-card rounded-b-md shadow-[var(--shadow-sm)] pt-[env(safe-area-inset-top)]"
      variants={barVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <motion.div variants={itemVariants}>
          <Logo to="/" size="sm" />
        </motion.div>

        <div className="flex items-center gap-2">
          <motion.div variants={itemVariants}>
            <Action
              variant="unstyled"
              aria-label="Notifications"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-mint/60 transition-colors"
            >
              <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
            </Action>
          </motion.div>

          {user && (
            <motion.div variants={itemVariants}>
              <Action to="/me" variant="unstyled" aria-label="View profile">
                <Avatar
                  src={user.avatar_url}
                  fallback={<span className="text-emerald font-bold">{user.name?.[0]?.toUpperCase() ?? '?'}</span>}
                  size="sm"
                  shape="circle"
                />
              </Action>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
