import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * OptionCard — a selectable card-shaped button for multi-select or single-
 * select form patterns. Renders as a `<button>` so it gets keyboard focus,
 * Space/Enter activation, and `aria-pressed` toggle semantics for free.
 *
 * Shaped like a Card (padded surface, mint border, rounded-md per the
 * project border-radius preference) but interactive. On select, a leaf-filled
 * checkbox-style indicator appears on the left.
 *
 * Usage — multi-select room picker:
 *
 *   {rooms.map((room) => (
 *     <OptionCard
 *       key={room.name}
 *       selected={selected.includes(room.name)}
 *       onClick={() => toggle(room.name)}
 *     >
 *       {room.name}
 *     </OptionCard>
 *   ))}
 *
 * Children can be plain text or a richer block (icon + label + meta). The
 * indicator and flex layout are owned by the component.
 */

const BASE = 'w-full flex items-center gap-3 px-4 py-3 rounded-md border text-left cursor-pointer transition-all'
const SELECTED = 'bg-leaf/10 border-leaf text-ink'
const UNSELECTED = 'bg-card border-mint text-ink hover:border-leaf/50'
const INDICATOR_BASE = 'w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-all shrink-0'
const INDICATOR_ON = 'bg-leaf border-leaf'
const INDICATOR_OFF = 'border-mint'

export default function OptionCard({ selected = false, onClick, className = '', children, ...kwargs }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`${BASE} ${selected ? SELECTED : UNSELECTED} ${className}`}
      {...kwargs}
    >
      <span className={`${INDICATOR_BASE} ${selected ? INDICATOR_ON : INDICATOR_OFF}`}>
        {selected && <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />}
      </span>
      <span className="flex-1 text-sm font-bold">{children}</span>
    </button>
  )
}
