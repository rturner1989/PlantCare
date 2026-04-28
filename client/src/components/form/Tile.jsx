import Action from '../ui/Action'

const BASE =
  'flex items-center gap-2 px-3 py-2.5 rounded-md border-[1.5px] text-sm font-bold transition-colors duration-200'

const SELECTED = 'bg-leaf border-leaf text-paper'
const UNSELECTED = 'bg-paper-deep border-paper-edge text-ink-soft hover:border-emerald/40'
const DASHED = 'border-dashed bg-transparent text-ink-soft hover:text-emerald hover:border-emerald/40 justify-center'

const ICON_BASE = 'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0'
const ICON_SELECTED = 'bg-paper/25 text-paper'
const ICON_UNSELECTED = 'bg-mint text-emerald'

export default function Tile({ icon, selected = false, dashed = false, onClick, className = '', children, ...kwargs }) {
  if (dashed) {
    return (
      <Action variant="unstyled" onClick={onClick} className={`${BASE} ${DASHED} ${className}`} {...kwargs}>
        {children}
      </Action>
    )
  }

  return (
    <Action
      variant="unstyled"
      role="checkbox"
      aria-checked={selected}
      onClick={onClick}
      className={`${BASE} ${selected ? SELECTED : UNSELECTED} ${className}`}
      {...kwargs}
    >
      {icon && <span className={`${ICON_BASE} ${selected ? ICON_SELECTED : ICON_UNSELECTED}`}>{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </Action>
  )
}
