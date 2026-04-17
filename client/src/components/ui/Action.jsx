import { Link } from 'react-router-dom'

const BASE_ROUND = 'inline-flex items-center justify-center rounded-full transition-transform'
const SIZE_MD = 'gap-2 px-6 py-3 text-sm font-extrabold active:scale-[0.98]'

const VARIANT_CLASSES = {
  primary: `${BASE_ROUND} ${SIZE_MD} text-white bg-[image:var(--gradient-brand)] shadow-[var(--shadow-cta)]`,
  secondary: `${BASE_ROUND} ${SIZE_MD} bg-mint text-emerald`,
  fab: `${BASE_ROUND} w-[54px] h-[54px] text-white bg-[image:var(--gradient-brand)] shadow-[var(--shadow-fab)] active:scale-95`,
  'cta-card':
    'block w-full p-4 rounded-lg text-white text-left bg-[image:var(--gradient-forest)] transition-transform active:scale-[0.99]',
  ghost: 'inline-flex items-center gap-1 text-ink-soft font-semibold hover:text-ink transition-colors',
  unstyled: '',
}

const FOCUS_VISIBLE =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2'

// Tailwind v4 preflight already zeros `border-width` on every element, so
// adding `border-0` here was redundant — and worse, it fought consumers
// who opt into a border via className (OptionCard, RoomCard). Just the
// cursor is enough to mark the button as interactive.
const BUTTON_RESET = 'cursor-pointer'
const LINK_RESET = 'no-underline'

// Focus-visible ring is applied universally — including `variant="unstyled"`.
// Earlier the ring was skipped for unstyled so card/icon-button consumers
// could "bring their own everything", but in practice they all ended up
// duplicating the same three focus-visible classes in their own className.
// Unifying it here gives every clickable Action a keyboard-visible focus
// state for free and avoids the drift.
function compose(variant, elementReset, userClassName) {
  const variantClasses = VARIANT_CLASSES[variant] ?? ''
  return [variantClasses, elementReset, FOCUS_VISIBLE, userClassName].filter(Boolean).join(' ')
}

export default function Action({
  to,
  href,
  external = false,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  type,
  children,
  'aria-label': ariaLabel,
  ...kwargs
}) {
  // Internal navigation → <Link>
  if (to) {
    const classes = compose(variant, LINK_RESET, className)
    if (disabled) {
      return (
        <span className={classes} aria-disabled="true" {...kwargs}>
          {children}
        </span>
      )
    }
    return (
      <Link to={to} className={classes} aria-label={ariaLabel} {...kwargs}>
        {children}
      </Link>
    )
  }

  // External URL → <a>
  if (href) {
    const classes = compose(variant, LINK_RESET, className)
    const targetProps = external ? { target: '_blank', rel: 'noopener noreferrer' } : {}
    if (disabled) {
      return (
        <span className={classes} aria-disabled="true" {...kwargs}>
          {children}
        </span>
      )
    }
    return (
      <a href={href} className={classes} aria-label={ariaLabel} {...targetProps} {...kwargs}>
        {children}
      </a>
    )
  }

  // Default → <button>
  // `disabled:opacity-60 disabled:cursor-not-allowed` is the right default
  // for buttons with a baked-in visual (primary, secondary, fab, ghost),
  // but unstyled consumers define their own disabled appearance — e.g. the
  // Today task-row check circle renders as leaf-filled when done, not
  // 60%-opaque grey. Skipping the default for unstyled keeps those cases
  // from having to override with `disabled:opacity-100` gymnastics.
  const baseButtonClasses = compose(variant, BUTTON_RESET, className)
  const classes =
    variant === 'unstyled' ? baseButtonClasses : `${baseButtonClasses} disabled:opacity-60 disabled:cursor-not-allowed`

  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
      {...kwargs}
    >
      {children}
    </button>
  )
}
