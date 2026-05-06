import { faBars, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { useAuth } from '../hooks/useAuth'
import { useSearchActions } from '../hooks/useSearch'
import Logo from './Logo'
import NotificationsTrigger from './notifications/NotificationsTrigger'
import OrganiserTrigger from './organiser/OrganiserTrigger'
import Action from './ui/Action'
import Avatar from './ui/Avatar'
import Tooltip from './ui/Tooltip'

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

export default function MobileTopBar({ isFirstRun = false, onMenuOpen }) {
  const { user } = useAuth()
  const search = useSearchActions()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = isFirstRun && !shouldReduceMotion

  return (
    <motion.header
      className="md:hidden fixed top-0 left-0 right-0 z-30 bg-card rounded-b-md shadow-[var(--shadow-sm)] pt-[env(safe-area-inset-top)]"
      variants={barVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          {onMenuOpen && (
            <motion.div variants={itemVariants} className="hidden xs:flex">
              <Action
                variant="unstyled"
                onClick={onMenuOpen}
                aria-label="Open menu"
                className="w-9 h-9 relative group rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-mint/60 transition-colors"
              >
                <FontAwesomeIcon icon={faBars} className="w-4 h-4" />
                <Tooltip placement="bottom">Menu</Tooltip>
              </Action>
            </motion.div>
          )}
          <motion.div variants={itemVariants}>
            <Logo to="/" size="sm" />
          </motion.div>
        </div>

        <div className="flex items-center gap-2">
          {search.isActive && (
            <motion.div variants={itemVariants}>
              <Action
                variant="unstyled"
                onClick={search.openMobileDrawer}
                aria-label="Open search"
                className="w-9 h-9 relative group rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-mint/60 transition-colors"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />
                <Tooltip placement="bottom">Search</Tooltip>
              </Action>
            </motion.div>
          )}
          <motion.div variants={itemVariants}>
            <OrganiserTrigger size="lg" />
          </motion.div>
          <motion.div variants={itemVariants}>
            <NotificationsTrigger size="lg" />
          </motion.div>

          {user && (
            <motion.div variants={itemVariants}>
              <Action to="/me" variant="unstyled" aria-label="View profile" className="relative group">
                <Avatar
                  src={user.avatar_url}
                  fallback={<span className="text-emerald font-bold">{user.name?.[0]?.toUpperCase() ?? '?'}</span>}
                  size="sm"
                  shape="circle"
                />
                <Tooltip placement="bottom">Profile</Tooltip>
              </Action>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  )
}
