import { faHouse, faMagnifyingGlass, faPlus, faSun, faUser } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import Action from './ui/Action'
import Badge from './ui/Badge'

// TODO: replace hardcoded counts with real data once dashboard + house queries land.
// Today = tasks due today; House = total plants.
const navItems = [
  { to: '/', label: 'Today', icon: faSun, count: 2 },
  { to: '/house', label: 'House', icon: faHouse, count: 12 },
  { to: '/discover', label: 'Discover', icon: faMagnifyingGlass },
  { to: '/me', label: 'Me', icon: faUser },
]

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

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-dvh bg-card border-r border-mint fixed left-0 top-0 z-40">
      <Logo to="/" className="px-6 pt-6 pb-4" />

      <div className="px-6 pt-4 pb-2">
        <span className="text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.12em]">Navigate</span>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <SidebarNavLink key={item.to} {...item} />
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
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-full bg-mint flex items-center justify-center text-emerald font-bold text-sm">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-ink">{user.name}</p>
              <p className="text-xs text-ink-soft">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
