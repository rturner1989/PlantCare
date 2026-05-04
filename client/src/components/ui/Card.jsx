// Cards stack their slots vertically by default — Card.Header /
// Card.Body / Card.Footer were always meant to flow top-to-bottom.
// Baking the flex column in saves consumers the boilerplate.
const BASE = 'rounded-md flex flex-col'

const VARIANTS = {
  solid: 'bg-card border border-mint overflow-hidden',
  glass: 'glass-card overflow-hidden',
  // Warm-shadow paper for Today widgets and any surface that wants the
  // mockup's lifted-card look. shrink-0 baked in — every Today widget
  // sits inside a flex-column page main and never wants to compress
  // below its content. Padding/gap stay on consumers because they
  // vary (e.g. PlantsRow drops pb to give tile shadow room). No
  // clipping — children with shadows render below the card's edge.
  'paper-warm': 'bg-paper shadow-warm-sm shrink-0',
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

// Header-row meta — direct port of the v2 mockup `.sl-meta`. Optional
// emerald count + uppercase tracking copy. Sits next to the heading
// inside Card.Header (or any subsection header).
function Meta({ count, children, className = '' }) {
  return (
    <span className={`text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft ${className}`}>
      {count != null ? (
        <>
          <strong className="text-emerald font-extrabold">{count}</strong>{' '}
        </>
      ) : null}
      {children}
    </span>
  )
}

Card.Header = Header
Card.Body = Body
Card.Footer = Footer
Card.Meta = Meta

export default Card
