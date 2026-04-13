const BASE = 'inline-flex items-center justify-center gap-1 rounded-full font-extrabold text-[10px] px-2 py-0.5'

const SCHEMES = {
  neutral: {
    softBg: 'bg-mint',
    solidBg: 'bg-mint',
    outlineBorder: 'border-mint',
    quietText: 'text-ink',
    solidText: 'text-ink',
  },
  forest: {
    softBg: 'bg-forest/10',
    solidBg: 'bg-forest',
    outlineBorder: 'border-forest/30',
    quietText: 'text-ink',
    solidText: 'text-lime',
  },
  leaf: {
    softBg: 'bg-leaf/10',
    solidBg: 'bg-leaf',
    outlineBorder: 'border-leaf',
    quietText: 'text-forest',
    solidText: 'text-card',
  },
  emerald: {
    softBg: 'bg-emerald/10',
    solidBg: 'bg-emerald',
    outlineBorder: 'border-emerald',
    quietText: 'text-emerald',
    solidText: 'text-card',
  },
  sunshine: {
    softBg: 'bg-sunshine/15',
    solidBg: 'bg-sunshine',
    outlineBorder: 'border-sunshine',
    quietText: 'text-ink',
    solidText: 'text-ink',
  },
  coral: {
    softBg: 'bg-coral/10',
    solidBg: 'bg-coral',
    outlineBorder: 'border-coral',
    quietText: 'text-coral',
    solidText: 'text-card',
  },
}

function schemeClasses(variant, scheme) {
  const schemeRecipe = SCHEMES[scheme] ?? SCHEMES.neutral
  switch (variant) {
    case 'solid':
      return `${schemeRecipe.solidBg} ${schemeRecipe.solidText}`
    case 'outline':
      return `border ${schemeRecipe.outlineBorder} ${schemeRecipe.quietText}`
    default: // 'soft' and any unknown variant
      return `${schemeRecipe.softBg} ${schemeRecipe.quietText}`
  }
}

export default function Badge({ scheme = 'neutral', variant = 'soft', className = '', children, ...kwargs }) {
  if (children == null || children === false || children === '') return null

  const classes = [BASE, schemeClasses(variant, scheme), className].filter(Boolean).join(' ')

  return (
    <span className={classes} {...kwargs}>
      {children}
    </span>
  )
}
