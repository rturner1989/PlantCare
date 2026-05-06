import PlantAvatar from '../../plants/Avatar'
import Action from '../../ui/Action'
import Card from '../../ui/Card'

const PEEK_LIMIT = 3

const ICON_VARIANT = {
  indoor: 'bg-mint text-emerald',
  outdoor: 'bg-sunshine/20 text-sunshine-deep',
}

// The card itself is one button; an "edit pencil" affordance lives as
// a sibling in the parent `<li>` (positioned absolutely over the card)
// rather than nested inside this Action — nested interactive elements
// are invalid HTML and confuse assistive tech.
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

  return (
    <Action variant="unstyled" onClick={onClick} className="block w-full h-full text-left">
      <Card variant="paper-warm" className="h-full min-h-[200px] p-4 gap-2.5 hover:shadow-warm-md transition-shadow">
        <Card.Header divider={false} className="flex items-start gap-2.5">
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
          {/* Reserves space for the sibling edit button that the consumer
              positions absolutely over the card. Keeps the title block
              from running into the pencil. */}
          <span aria-hidden="true" className="shrink-0 w-7 h-7" />
        </Card.Header>

        <Card.Body className="!overflow-visible !flex-none">
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
        </Card.Body>

        <Card.Footer
          divider={false}
          className="mt-auto pt-2.5 border-t border-dashed border-paper-edge flex flex-col gap-1.5 text-[11px] text-ink-soft min-h-[62px]"
        >
          {nextCare && <SummaryRow icon={nextCare.icon} text={nextCare.label} overdue={nextCare.overdue} />}
          {weatherPill ? (
            <WeatherPillRow icon={weatherPill.icon} label={weatherPill.label} scheme={weatherPill.scheme} />
          ) : envHint ? (
            <SummaryRow icon="☀" text={envHint} />
          ) : null}
        </Card.Footer>
      </Card>
    </Action>
  )
}

const WEATHER_SCHEME = {
  frost: 'bg-frost text-frost-deep ring-frost-deep/20',
  default: 'bg-sky text-sky-deep ring-sky-deep/20',
}
const WEATHER_ICON_SCHEME = {
  frost: 'bg-frost-deep text-paper',
  default: 'bg-sky-deep text-paper',
}

function WeatherPillRow({ icon, label, scheme }) {
  const pillScheme = WEATHER_SCHEME[scheme] ?? WEATHER_SCHEME.default
  const iconScheme = WEATHER_ICON_SCHEME[scheme] ?? WEATHER_ICON_SCHEME.default
  return (
    <p
      className={`self-start max-w-full truncate flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full ring-1 ring-inset font-bold text-[11px] min-h-[20px] ${pillScheme}`}
    >
      <span
        aria-hidden="true"
        className={`shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] shadow-[0_2px_6px_rgba(44,106,148,0.3)] ${iconScheme}`}
      >
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </p>
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
      {overdue ? <em className="font-display italic text-coral-deep font-medium">{text}</em> : <span>{text}</span>}
    </p>
  )
}
