import Action from '../ui/Action'

const BASE = 'flex items-center rounded-md transition-colors duration-200 cursor-pointer'

const SIZES = {
  chip: 'gap-2 px-3 py-2.5 text-sm font-bold border-[1.5px]',
  card: 'gap-3 p-3 border',
}

const SELECTED_BY_SIZE = {
  chip: 'bg-leaf border-leaf text-paper',
  card: 'bg-mint border-leaf',
}

const UNSELECTED_BY_SIZE = {
  chip: 'bg-paper-deep border-paper-edge text-ink-soft hover:border-emerald/40',
  card: 'bg-paper-deep border-paper-edge hover:border-leaf hover:bg-mint/40',
}

const ICON_BY_SIZE = {
  chip: {
    base: 'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
    selected: 'bg-paper/25 text-paper',
    unselected: 'bg-mint text-emerald',
  },
  card: {
    base: 'text-2xl shrink-0',
    selected: '',
    unselected: '',
  },
}

const DASHED =
  'flex items-center gap-2 px-3 py-2.5 rounded-md border-[1.5px] text-sm font-bold border-dashed bg-transparent text-ink-soft hover:text-emerald hover:border-emerald/40 justify-center transition-colors duration-200 cursor-pointer'

export default function Tile({
  icon,
  selected = false,
  dashed = false,
  size = 'chip',
  onClick,
  className = '',
  children,
  ...kwargs
}) {
  if (dashed) {
    return (
      <Action variant="unstyled" onClick={onClick} className={`${DASHED} ${className}`} {...kwargs}>
        {children}
      </Action>
    )
  }

  const sizeClass = SIZES[size]
  const stateClass = selected ? SELECTED_BY_SIZE[size] : UNSELECTED_BY_SIZE[size]
  const iconConfig = ICON_BY_SIZE[size]
  const iconStateClass = selected ? iconConfig.selected : iconConfig.unselected

  // chip variant = toggle (Step 2 spaces) — checkbox semantics so screen
  // readers announce selection state. card variant = one-shot trigger
  // (Step 3 species → opens add-plant dialog) — native button is correct.
  const toggleProps = size === 'chip' ? { role: 'checkbox', 'aria-checked': selected } : {}

  return (
    <Action
      variant="unstyled"
      onClick={onClick}
      className={`${BASE} ${sizeClass} w-full ${stateClass} ${className}`}
      {...toggleProps}
      {...kwargs}
    >
      {icon && <span className={`${iconConfig.base} ${iconStateClass}`}>{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </Action>
  )
}
