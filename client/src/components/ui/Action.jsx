import { Link } from 'react-router-dom'

const BASE_ROUND = 'inline-flex items-center justify-center rounded-full transition-transform'
const SIZE_MD = 'gap-2 px-6 py-3 text-sm font-extrabold active:scale-[0.98]'

const VARIANT_CLASSES = {
  primary: `${BASE_ROUND} ${SIZE_MD} text-white bg-[image:var(--gradient-brand)]`,
  secondary: `${BASE_ROUND} ${SIZE_MD} bg-mint text-emerald`,
  fab: `${BASE_ROUND} w-[54px] h-[54px] text-white bg-[image:var(--gradient-brand)] shadow-[var(--shadow-fab)] active:scale-95`,
  'cta-card':
    'block w-full p-4 rounded-lg text-white text-left bg-[image:var(--gradient-forest)] transition-transform active:scale-[0.99]',
  ghost: 'inline-flex items-center gap-1 text-ink-soft font-semibold hover:text-ink transition-colors',
  unstyled: '',
}

const FOCUS_VISIBLE =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2'

const BUTTON_RESET = 'border-0 cursor-pointer'
const LINK_RESET = 'no-underline'

function compose(variant, elementReset, userClassName) {
  const variantClasses = VARIANT_CLASSES[variant] ?? ''
  const focusRing = variant === 'unstyled' ? '' : FOCUS_VISIBLE
  return [variantClasses, elementReset, focusRing, userClassName].filter(Boolean).join(' ')
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
  const baseButtonClasses = compose(variant, BUTTON_RESET, className)
  const classes = `${baseButtonClasses} disabled:opacity-60 disabled:cursor-not-allowed`

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
