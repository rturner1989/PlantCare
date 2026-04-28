import Preheading from './Preheading'

const VARIANTS = {
  display: 'font-display italic font-normal text-[34px] sm:text-[40px] leading-[1.15] tracking-tight',
  'display-lg': 'font-display italic font-normal text-[44px] lg:text-[54px] leading-[1.02] tracking-tight',
  'display-xl': 'font-display italic font-light text-[40px] lg:text-[64px] leading-[1.15] tracking-tight',
  compact: 'font-sans font-extrabold text-base text-ink leading-tight',
}

const PREHEADING_VARIANT_BY_HEADING = {
  display: 'card',
  'display-lg': 'pill',
  'display-xl': 'card',
  compact: 'card',
}

export default function Heading({
  as: Tag = 'h1',
  variant = 'display',
  className = '',
  preheading,
  subtitle,
  children,
  ...kwargs
}) {
  const variantClasses = VARIANTS[variant] ?? VARIANTS.display

  if (!preheading && !subtitle) {
    return (
      <Tag className={`${variantClasses} ${className}`} {...kwargs}>
        {children}
      </Tag>
    )
  }

  const preheadingVariant = PREHEADING_VARIANT_BY_HEADING[variant] ?? 'card'

  return (
    <div className={className}>
      {preheading && <Preheading variant={preheadingVariant}>{preheading}</Preheading>}
      <Tag className={variantClasses} {...kwargs}>
        {children}
      </Tag>
      {subtitle && <p className="mt-2 text-sm text-ink-soft leading-relaxed">{subtitle}</p>}
    </div>
  )
}
