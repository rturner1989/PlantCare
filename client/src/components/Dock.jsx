import { faHouse, faPenToSquare, faPlus, faSun, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import Action from './ui/Action'
import Tooltip from './ui/Tooltip'

const navItems = [
  { to: '/', label: 'Today', icon: faSun, end: true },
  { to: '/house', label: 'House', icon: faHouse },
  { to: '/journal', label: 'Journal', icon: faPenToSquare },
  { to: '/me', label: 'Me', icon: faUser },
]

const LEFT_ITEMS = navItems.slice(0, 2)
const RIGHT_ITEMS = navItems.slice(2)

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

function DockNavLink({ to, label, icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
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

  return (
    <motion.nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 xs:hidden bg-paper/[0.78] backdrop-blur-heavy backdrop-saturate-150 rounded-t-md border-t border-paper/60 shadow-[var(--shadow-dock)] pb-[clamp(2px,env(safe-area-inset-bottom),12px)]"
      variants={dockVariants}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
    >
      <div className="flex items-center justify-around px-4 h-[74px]">
        {LEFT_ITEMS.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <DockNavLink {...item} />
          </motion.div>
        ))}

        <motion.div variants={itemVariants}>
          <Action to="/add-plant" variant="fab" aria-label="Add plant" className="relative group -top-3.5">
            <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
            <Tooltip placement="top">Add plant</Tooltip>
          </Action>
        </motion.div>

        {RIGHT_ITEMS.map((item) => (
          <motion.div key={item.to} variants={itemVariants}>
            <DockNavLink {...item} />
          </motion.div>
        ))}
      </div>
    </motion.nav>
  )
}
