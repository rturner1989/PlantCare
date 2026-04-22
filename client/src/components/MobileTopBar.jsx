import { faBell } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import Action from './ui/Action'
import Avatar from './ui/Avatar'

/**
 * MobileTopBar — edge-to-edge mobile chrome above the page content.
 *
 * Logo on the left (routes home), avatar + notifications bell on the
 * right. Background extends into the safe-area-inset-top so status-bar
 * chrome sits on the same colour as the bar itself. Hidden on `lg+`
 * where the Sidebar owns brand + profile affordances instead.
 *
 * The bell is currently a visual placeholder — no notification
 * system wired yet. Kept in the tree with aria-label so future work
 * can flip the handler and a coral dot without touching layout.
 */
export default function MobileTopBar() {
  const { user } = useAuth()

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-mint pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Logo to="/" size="sm" />

        <div className="flex items-center gap-2">
          <Action
            variant="unstyled"
            aria-label="Notifications"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-mint/60 transition-colors"
          >
            <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
          </Action>

          {user && (
            <Action to="/me" variant="unstyled" aria-label="View profile">
              <Avatar
                src={user.avatar_url}
                fallback={<span className="text-emerald font-bold">{user.name?.[0]?.toUpperCase() ?? '?'}</span>}
                size="sm"
                shape="circle"
              />
            </Action>
          )}
        </div>
      </div>
    </div>
  )
}
