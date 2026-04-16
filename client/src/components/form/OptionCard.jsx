import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * OptionCard — a selectable card-shaped button for multi-select or single-
 * select form patterns. Renders as a `<button>` so it gets keyboard focus,
 * Space/Enter activation, and `aria-pressed` toggle semantics for free.
 *
 * Layout: optional 34×34 icon tile on the left + label + round check
 * indicator on the right. The icon tile is shown when an `icon` prop is
 * passed (an FA icon reference) and inherits the selection colours —
 * mint tile / emerald glyph when unselected, leaf tile / white glyph
 * when selected. Use for preset pickers where each option represents a
 * known concept with an iconographic shortcut (rooms, categories, etc.);
 * omit the icon prop for free-form selections (custom rooms).
 *
 * Usage — multi-select room picker:
 *
 *   <OptionCard
 *     icon={faCouch}
 *     selected={selected.includes('Living Room')}
 *     onClick={() => toggle('Living Room')}
 *   >
 *     Living Room
 *   </OptionCard>
 *
 *   // No icon — custom room, free text only:
 *   <OptionCard selected={...} onClick={...}>
 *     My Greenhouse
 *   </OptionCard>
 */

const BASE = 'w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left cursor-pointer transition-all'
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
    <button
      type="button"
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
    </button>
  )
}
