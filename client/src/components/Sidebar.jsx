import { faArrowRightFromBracket, faHouse, faMagnifyingGlass, faPlus, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import Action from './ui/Action'
import Badge from './ui/Badge'

// TODO(ticket 14): real counts from dashboard + house queries.
// /me lives in the footer avatar on desktop; the Dock handles it for mobile.
const navItems = [
  { to: '/', label: 'Today', icon: faSun, count: 2 },
  { to: '/house', label: 'House', icon: faHouse, count: 12 },
  { to: '/discover', label: 'Discover', icon: faMagnifyingGlass },
]

const asideVariants = {
  hidden: { x: -260 },
  visible: {
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

function SidebarNavLink({ to, label, icon, count }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 py-[11px] px-[14px] rounded-md text-sm font-bold tracking-[-0.01em] mb-1 transition-colors ${
          isActive
            ? 'bg-mint text-forest before:content-[""] before:w-1 before:h-[22px] before:bg-leaf before:rounded-full before:-mr-1'
            : 'text-ink-soft hover:bg-mint/50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <FontAwesomeIcon icon={icon} className="w-5 h-5" />
          <span className="flex-1">{label}</span>

          <Badge scheme={isActive ? 'leaf' : 'forest'} variant={isActive ? 'solid' : 'soft'}>
            {count}
          </Badge>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ isFirstRun = false }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = isFirstRun && !shouldReduceMotion

  // TODO(ticket 14): move to Me profile page.
  async function handleLogout() {
    await logout()
    toast.success('Logged out')
  }

  return (
    <motion.aside
      className="hidden lg:flex flex-col w-[260px] h-dvh bg-card border-r border-mint fixed left-0 top-0 z-40"
      variants={asideVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <Logo to="/" className="px-6 pt-6 pb-4" />

      <div className="px-6 pt-4 pb-2">
        <span className="text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.12em]">Navigate</span>
      </div>

      <nav aria-label="Primary" className="flex-1 px-3">
        {navItems.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <SidebarNavLink {...item} />
          </motion.div>
        ))}
      </nav>

      <div className="px-4 pb-4">
        <Action to="/add-plant" variant="cta-card">
          <div className="flex items-center gap-2 text-lime">
            <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
            <span className="text-sm font-extrabold">New plant</span>
          </div>

          <p className="text-xs text-lime/70 mt-1">Add a new plant to your collection</p>
        </Action>
      </div>

      {user && (
        <div className="px-4 pb-6 border-t border-mint pt-4">
          <div className="flex items-center gap-2">
            <Action
              to="/me"
              variant="unstyled"
              aria-label="View profile"
              className="flex items-center gap-3 flex-1 min-w-0 p-1 rounded-md hover:bg-mint/50 transition-colors"
            >
              <div className="w-[38px] h-[38px] rounded-full bg-mint flex items-center justify-center text-emerald font-bold text-sm shrink-0">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                <p className="text-xs text-ink-soft truncate">{user.email}</p>
              </div>
            </Action>
            <Action
              onClick={handleLogout}
              variant="unstyled"
              aria-label="Log out"
              className="text-ink-soft hover:text-coral-deep transition-colors p-1 rounded-md shrink-0"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4" />
            </Action>
          </div>
        </div>
      )}
    </motion.aside>
  )
}
