const BASE = 'rounded-md overflow-hidden'

const VARIANTS = {
  solid: 'bg-card border border-mint',
  glass: 'glass-card',
}

function Card({ variant = 'solid', className = '', ref, children, ...kwargs }) {
  const variantClass = VARIANTS[variant] ?? VARIANTS.solid
  return (
    <div ref={ref} className={`${BASE} ${variantClass} ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

function Header({ className = '', divider = true, children, ...kwargs }) {
  const dividerClass = divider ? 'border-b border-mint' : ''
  return (
    <div className={`${dividerClass} ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

function Body({ className = '', children, ...kwargs }) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

function Footer({ className = '', divider = true, children, ...kwargs }) {
  const dividerClass = divider ? 'border-t border-mint' : ''
  return (
    <div className={`${dividerClass} ${className}`} {...kwargs}>
      {children}
    </div>
  )
}

Card.Header = Header
Card.Body = Body
Card.Footer = Footer

export default Card
