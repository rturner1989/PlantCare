import ProgressRing from '../../ProgressRing'

const RING_COLOR_BY_SCHEME = {
  streak: 'var(--coral)',
  vitality: 'var(--leaf)',
}

const LABEL_COLOR_BY_SCHEME = {
  streak: 'text-coral-deep',
  vitality: 'text-emerald',
}

export default function StakeRing({ scheme, label, percent, valueDisplay, unit, title, description }) {
  const ringColor = RING_COLOR_BY_SCHEME[scheme] ?? RING_COLOR_BY_SCHEME.vitality
  const labelColor = LABEL_COLOR_BY_SCHEME[scheme] ?? LABEL_COLOR_BY_SCHEME.vitality

  return (
    <div className="flex-1 flex flex-col items-center text-center gap-2 p-4 bg-paper-deep border border-paper-edge rounded-md">
      <p className={`text-[10px] font-extrabold uppercase tracking-[0.14em] ${labelColor}`}>{label}</p>

      <ProgressRing value={percent} size={128} strokeWidth={10} color={ringColor} trackColor="var(--paper-edge)">
        <div className="flex flex-col items-center">
          <span className="font-display italic text-3xl font-medium text-ink leading-none">{valueDisplay}</span>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink-soft mt-1">{unit}</span>
        </div>
      </ProgressRing>

      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-xs text-ink-soft leading-snug">{description}</p>
    </div>
  )
}
