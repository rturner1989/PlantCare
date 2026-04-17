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

const BASE = 'w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left transition-all'
const SELECTED = 'bg-leaf/10 border-leaf text-ink'
const UNSELECTED = 'bg-card border-mint text-ink hover:border-leaf/50'

const TILE_BASE = 'w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 transition-colors'
const TILE_SELECTED = 'bg-leaf text-card'
const TILE_UNSELECTED = 'bg-mint text-emerald'

const CHECK_BASE = 'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all'
const CHECK_SELECTED = 'bg-leaf border-leaf'
const CHECK_UNSELECTED = 'bg-card border-mint'

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
        {selected && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
      </span>
    </Action>
  )
}
