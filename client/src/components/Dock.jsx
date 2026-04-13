import { faHouse, faMagnifyingGlass, faPlus, faSun, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Today', icon: faSun },
  { to: '/house', label: 'House', icon: faHouse },
  { to: '/discover', label: 'Discover', icon: faMagnifyingGlass },
  { to: '/me', label: 'Me', icon: faUser },
]

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

export default function Dock() {
  const navigate = useNavigate()
  const leftItems = navItems.slice(0, 2)
  const rightItems = navItems.slice(2)

  return (
    <nav className="fixed bottom-[10px] left-3 right-3 h-[74px] z-50 flex items-center justify-around px-4 lg:hidden bg-white/[0.78] backdrop-blur-xl backdrop-saturate-150 rounded-3xl border border-white/60 shadow-[var(--shadow-dock)]">
      {leftItems.map((item) => (
        <DockNavLink key={item.to} {...item} />
      ))}

      <button
        type="button"
        onClick={() => navigate('/add-plant')}
        className="relative -top-3.5 flex items-center justify-center w-[54px] h-[54px] rounded-full text-white cursor-pointer border-0 bg-[image:var(--gradient-brand)] shadow-[var(--shadow-fab)]"
      >
        <FontAwesomeIcon icon={faPlus} className="w-6 h-6" />
      </button>

      {rightItems.map((item) => (
        <DockNavLink key={item.to} {...item} />
      ))}
    </nav>
  )
}
