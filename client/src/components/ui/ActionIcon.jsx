import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Action from './Action'
import Tooltip from './Tooltip'

const HOVER_SCHEMES = {
  // Default — neutral darken on hover. Non-action affordances.
  neutral: 'bg-ink/[0.04] hover:bg-ink/[0.08] hover:text-ink',
  // Paper-deep base + mint hover. Sidebar/topbar chrome triggers
  // (organiser, notifications, mobile menu close).
  paper: 'bg-paper-deep hover:bg-mint/60 hover:text-ink',
  // Soft ink wash + ink hover. In-card chip dismiss / drawer close.
  ink: 'bg-ink/[0.08] hover:bg-ink/[0.12] hover:text-ink',
  // Edit-style — sunshine warning tint.
  warning: 'bg-ink/[0.04] hover:bg-sunshine/20 hover:text-sunshine-deep',
  // Delete-style — coral danger tint.
  danger: 'bg-ink/[0.04] hover:bg-coral/15 hover:text-coral-deep',
  // Ghost — transparent bg, accent on hover only. Use inside chrome
  // strips where surrounding fill is already paper-deep.
  ghost: 'hover:bg-paper-deep hover:text-ink',
  // Logout-flavoured ghost. Same transparent base, coral accent.
  'ghost-danger': 'hover:bg-coral/10 hover:text-coral-deep',
}

const SIZES = {
  xs: { wrapper: 'w-5 h-5', icon: 'w-2.5 h-2.5' },
  sm: { wrapper: 'w-7 h-7', icon: 'w-3 h-3' },
  md: { wrapper: 'w-9 h-9', icon: 'w-4 h-4' },
}

// Round icon-only action button with hover accent + Tooltip + aria-label.
// Standardises every icon-only affordance: edit/delete clusters,
// sidebar/topbar chrome triggers, drawer close X, etc.
//
// Tooltip + aria-label both carry the action name. aria-label is the
// canonical accessible name; Tooltip is decorative reinforcement for
// sighted pointer/keyboard users. Pass `tooltip={false}` to suppress
// the tooltip entirely (e.g. tiny chip-internal X where the parent
// chip already names the action via aria-label).
//
// `ref` and `...kwargs` are forwarded to the underlying <Action> so
// callers can attach refs (popover anchors) and arbitrary attrs
// (aria-haspopup, aria-expanded, aria-controls, onPointerDown, etc.).
export default function ActionIcon({
  ref,
  icon,
  label,
  onClick,
  scheme = 'neutral',
  size = 'sm',
  tooltipPlacement = 'top',
  tooltip = true,
  className = '',
  ...kwargs
}) {
  const hoverClasses = HOVER_SCHEMES[scheme] ?? HOVER_SCHEMES.neutral
  const sizeRecipe = SIZES[size] ?? SIZES.sm

  return (
    <Action
      ref={ref}
      variant="unstyled"
      onClick={onClick}
      aria-label={label}
      className={`relative group ${sizeRecipe.wrapper} rounded-full text-ink-soft ${hoverClasses} transition-colors flex items-center justify-center cursor-pointer ${className}`}
      {...kwargs}
    >
      <FontAwesomeIcon icon={icon} className={sizeRecipe.icon} />
      {tooltip && <Tooltip placement={tooltipPlacement}>{label}</Tooltip>}
    </Action>
  )
}
