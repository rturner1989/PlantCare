import Heading from './Heading'
import Preheading from './Preheading'

export default function PageHeader({
  eyebrow,
  meta,
  actions,
  headingVariant = 'display',
  className = '',
  children,
}) {
  return (
    <header className={`flex items-end justify-between gap-4 flex-wrap ${className}`}>
      <div className="flex flex-col min-w-0">
        {eyebrow && <Preheading variant="card">{eyebrow}</Preheading>}
        <Heading as="h1" variant={headingVariant} className="text-ink">
          {children}
        </Heading>
        {meta && <p className="mt-1.5 text-xs font-semibold text-ink-soft">{meta}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  )
}
