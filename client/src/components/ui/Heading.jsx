import Preheading from './Preheading'

const VARIANTS = {
  display: 'font-display italic font-normal text-[34px] sm:text-[40px] leading-none tracking-tight',
  'display-lg': 'font-display italic font-normal text-[44px] lg:text-[54px] leading-[1.02] tracking-tight',
}

const PREHEADING_VARIANT_BY_HEADING = {
  display: 'card',
  'display-lg': 'pill',
}

export default function Heading({
  as: Tag = 'h1',
  variant = 'display',
  className = '',
  preheading,
  subtitle,
  children,
}) {
  const variantClasses = VARIANTS[variant] ?? VARIANTS.display

  if (!preheading && !subtitle) {
    return <Tag className={`${variantClasses} ${className}`}>{children}</Tag>
  }

  const preheadingVariant = PREHEADING_VARIANT_BY_HEADING[variant] ?? 'card'

  return (
    <div className={className}>
      {preheading && <Preheading variant={preheadingVariant}>{preheading}</Preheading>}
      <Tag className={variantClasses}>{children}</Tag>
      {subtitle && <p className="mt-2 text-sm text-ink-soft leading-relaxed">{subtitle}</p>}
    </div>
  )
}
