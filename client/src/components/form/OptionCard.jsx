import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Action from '../ui/Action'

/**
 * Selectable card-shaped button. The optional `icon` prop renders a
 * 34×34 tile on the left; omit it for label-only options.
 *
 *   <OptionCard icon={faCouch} selected={isSelected} onClick={toggle}>
 *     Living Room
 *   </OptionCard>
 */

// `duration-200` everywhere on the option (card border/bg, tile bg, check
// circle, check icon) so the visual cascade into the "selected" state
// lands in one smooth beat rather than several micro-transitions with
// subtly different timings.
const BASE = 'w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-colors duration-200'
const SELECTED = 'bg-leaf/10 border-leaf text-ink'
const UNSELECTED = 'bg-card border-mint text-ink hover:border-leaf/50'

const TILE_BASE =
  'w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200'
const TILE_SELECTED = 'bg-leaf text-card'
const TILE_UNSELECTED = 'bg-mint text-emerald'

const CHECK_BASE =
  'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200'
const CHECK_SELECTED = 'bg-leaf border-leaf'
const CHECK_UNSELECTED = 'bg-card border-mint'

// Check icon is always rendered but fades + scales between states — a
// conditional mount/unmount snaps visibly because the tick icon appears
// in its final shape instead of transitioning into it.
const CHECK_ICON_BASE = 'text-white text-[10px] transition-all duration-200'
const CHECK_ICON_SELECTED = 'opacity-100 scale-100'
const CHECK_ICON_UNSELECTED = 'opacity-0 scale-50'

export default function OptionCard({ icon, selected = false, onClick, className = '', children, ...kwargs }) {
  return (
    <Action
      variant="unstyled"
      onClick={onClick}
      aria-pressed={selected}
      className={`${BASE} ${selected ? SELECTED : UNSELECTED} ${className}`}
      {...kwargs}
    >
      {icon && (
        <span className={`${TILE_BASE} ${selected ? TILE_SELECTED : TILE_UNSELECTED}`}>
          <FontAwesomeIcon icon={icon} className="text-sm" />
        </span>
      )}
      <span className="flex-1 text-sm font-bold">{children}</span>
      <span className={`${CHECK_BASE} ${selected ? CHECK_SELECTED : CHECK_UNSELECTED}`}>
        <FontAwesomeIcon
          icon={faCheck}
          className={`${CHECK_ICON_BASE} ${selected ? CHECK_ICON_SELECTED : CHECK_ICON_UNSELECTED}`}
        />
      </span>
    </Action>
  )
}
