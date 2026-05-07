import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Action from './Action'
import Tooltip from './Tooltip'

const HOVER_SCHEMES = {
  // Default — neutral darken on hover. Non-action affordances.
  neutral: 'bg-ink/[0.04] hover:bg-ink/[0.08] hover:text-ink',
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
  sm: { wrapper: 'w-7 h-7', icon: 'w-3 h-3' },
  md: { wrapper: 'w-9 h-9', icon: 'w-4 h-4' },
}

// Round icon-only action button with hover accent + Tooltip + aria-label.
// Standardises every icon-only affordance: edit/delete clusters,
// sidebar/topbar chrome triggers, drawer close X, etc.
//
// Tooltip + aria-label both carry the action name. aria-label is the
// canonical accessible name; Tooltip is decorative reinforcement for
// sighted pointer/keyboard users.
export default function ActionIcon({
  icon,
  label,
  onClick,
  scheme = 'neutral',
  size = 'sm',
  tooltipPlacement = 'top',
  className = '',
}) {
  const hoverClasses = HOVER_SCHEMES[scheme] ?? HOVER_SCHEMES.neutral
  const sizeRecipe = SIZES[size] ?? SIZES.sm

  return (
    <Action
      variant="unstyled"
      onClick={onClick}
      aria-label={label}
      className={`relative group ${sizeRecipe.wrapper} rounded-full text-ink-soft ${hoverClasses} transition-colors flex items-center justify-center cursor-pointer ${className}`}
    >
      <FontAwesomeIcon icon={icon} className={sizeRecipe.icon} />
      <Tooltip placement={tooltipPlacement}>{label}</Tooltip>
    </Action>
  )
}
