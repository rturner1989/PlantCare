// Hover/focus tooltip span for icon-only triggers. Anchors to the
// nearest `relative` parent that also carries the `group` class —
// caller is responsible for both. The bubble fades in via Tailwind's
// `group-hover:` and `group-focus-visible:` modifiers, then auto-hides
// when the parent loses hover/focus. `pointer-events-none` so the
// bubble itself is never the click target.
//
//   <Action variant="unstyled" className="… relative group" aria-label="Open organiser">
//     <FontAwesomeIcon … />
//     <Tooltip placement="bottom">Organiser</Tooltip>
//   </Action>

const PLACEMENT = {
  right: 'left-full top-1/2 -translate-y-1/2 translate-x-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 -translate-x-1.5',
  top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-1.5',
}

export default function Tooltip({ placement = 'bottom', className = '', children }) {
  const placementClass = PLACEMENT[placement] ?? PLACEMENT.bottom
  return (
    <span
      role="tooltip"
      className={`absolute ${placementClass} px-2.5 py-1 rounded-full bg-ink text-paper text-[11px] font-bold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none transition-opacity duration-150 z-30 ${className}`}
    >
      {children}
    </span>
  )
}
