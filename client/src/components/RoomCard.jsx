import PlantAvatar from './PlantAvatar'
import Action from './ui/Action'
import Card from './ui/Card'

const PEEK_LIMIT = 3

const ICON_VARIANT = {
  indoor: 'bg-mint text-emerald',
  outdoor: 'bg-sunshine/20 text-sunshine-deep',
}

export default function RoomCard({
  icon,
  name,
  count,
  variant = 'indoor',
  peek = [],
  nextCare,
  envHint,
  weatherPill,
  onClick,
}) {
  const visiblePeek = peek.slice(0, PEEK_LIMIT)
  const hiddenCount = Math.max(0, peek.length - PEEK_LIMIT)
  const hasSecondRow = Boolean(weatherPill || envHint)

  return (
    <Action variant="unstyled" onClick={onClick} className="block w-full h-full text-left">
      <Card
        variant="paper-warm"
        className="h-full p-4 gap-2.5 hover:shadow-warm-md transition-shadow"
      >
        <Card.Header divider={false} className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className={`shrink-0 w-[34px] h-[34px] rounded-full flex items-center justify-center text-base ${ICON_VARIANT[variant]}`}
          >
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-ink tracking-tight truncate">{name}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-softer">{count}</p>
          </div>
        </Card.Header>

        {peek.length > 0 && (
          <ul aria-hidden="true" className="flex">
            {visiblePeek.map((plant, index) => (
              <li
                key={plant.id ?? index}
                className={`relative ${index === 0 ? 'ml-0' : '-ml-1.5'} ${
                  plant.urgent ? 'rounded-full ring-2 ring-coral shadow-[0_2px_6px_rgba(255,107,61,0.2)]' : ''
                }`}
              >
                <PlantAvatar species={plant.species} size="xs" shape="circle" />
              </li>
            ))}
            {hiddenCount > 0 && (
              <li
                key="more"
                className="-ml-1.5 w-8 h-8 rounded-full bg-paper-deep flex items-center justify-center text-[10px] font-extrabold text-ink-soft shadow-[inset_0_0_0_1px_var(--color-paper-edge),0_2px_6px_rgba(11,58,26,0.08)]"
              >
                +{hiddenCount}
              </li>
            )}
          </ul>
        )}

        <Card.Footer
          divider={false}
          className="mt-auto pt-2.5 border-t border-dashed border-paper-edge flex flex-col gap-1.5 text-[11px] text-ink-soft min-h-[62px]"
        >
          {nextCare && <SummaryRow icon={nextCare.icon} text={nextCare.label} overdue={nextCare.overdue} />}
          {hasSecondRow && !weatherPill && <SummaryRow icon="☀" text={envHint} />}
        </Card.Footer>
      </Card>
    </Action>
  )
}

function SummaryRow({ icon, text, overdue = false }) {
  return (
    <p className="flex items-center gap-1.5 font-semibold min-h-[20px]">
      <span
        aria-hidden="true"
        className="shrink-0 w-[18px] h-[18px] rounded-full bg-mint text-emerald flex items-center justify-center text-[10px]"
      >
        {icon}
      </span>
      {overdue ? (
        <em className="font-display italic text-coral-deep font-medium">{text}</em>
      ) : (
        <span>{text}</span>
      )}
    </p>
  )
}
