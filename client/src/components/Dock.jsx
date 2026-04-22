import { faHouse, faMagnifyingGlass, faPlus, faSun, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import Action from './ui/Action'

const navItems = [
  { to: '/', label: 'Today', icon: faSun },
  { to: '/house', label: 'House', icon: faHouse },
  { to: '/discover', label: 'Discover', icon: faMagnifyingGlass },
  { to: '/me', label: 'Me', icon: faUser },
]

const dockVariants = {
  hidden: { y: 100 },
  visible: {
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

function DockNavLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2 px-3 ${isActive ? 'text-forest' : 'text-ink-soft'}`
      }
    >
      <FontAwesomeIcon icon={icon} className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  )
}

export default function Dock({ isFirstRun = false }) {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = isFirstRun && !shouldReduceMotion
  const leftItems = navItems.slice(0, 2)
  const rightItems = navItems.slice(2)

  return (
    <motion.nav
      aria-label="Primary"
      className="fixed bottom-[10px] left-3 right-3 h-[74px] z-50 flex items-center justify-around px-4 lg:hidden bg-white/[0.78] backdrop-blur-xl backdrop-saturate-150 rounded-2xl border border-white/60 shadow-[var(--shadow-dock)]"
      variants={dockVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      {leftItems.map((item) => (
        <motion.div key={item.to} variants={itemVariants}>
          <DockNavLink {...item} />
        </motion.div>
      ))}

      <motion.div variants={itemVariants}>
        <Action to="/add-plant" variant="fab" aria-label="Add plant" className="relative -top-3.5">
          <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
        </Action>
      </motion.div>

      {rightItems.map((item) => (
        <motion.div key={item.to} variants={itemVariants}>
          <DockNavLink {...item} />
        </motion.div>
      ))}
    </motion.nav>
  )
}
