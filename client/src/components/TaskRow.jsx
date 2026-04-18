import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PlantAvatar from './PlantAvatar'
import Action from './ui/Action'
import Badge from './ui/Badge'

// Keys match backend care_logs.action values — rename-safe for telemetry later.
const CARE_TYPE_META = {
  watering: { label: 'Water', scheme: 'emerald' },
  feeding: { label: 'Feed', scheme: 'sunshine' },
}

// 'healthy'/'unknown' deliberately absent — Today only surfaces care due.
const STATUS_META = {
  overdue: { label: 'Overdue', scheme: 'coral' },
  due_today: { label: 'Due today', scheme: 'leaf' },
  due_soon: { label: 'Due soon', scheme: 'neutral' },
}

export default function TaskRow({ plant, careType = 'watering', voiceQuote, done = false, onComplete }) {
  const careMeta = CARE_TYPE_META[careType] ?? CARE_TYPE_META.watering
  const statusKey = careType === 'feeding' ? plant.feed_status : plant.water_status
  const statusMeta = STATUS_META[statusKey]
  const isOverdue = statusKey === 'overdue'

  // done beats overdue — a completed coral-tinted row would be noisy.
  let rowClasses
  if (done) {
    rowClasses = 'bg-mint/30 opacity-75 border border-mint'
  } else if (isOverdue) {
    rowClasses = 'bg-coral/5 border border-coral/30'
  } else {
    rowClasses = 'bg-card border border-mint'
  }

  const checkLabel = done
    ? `${careMeta.label} done for ${plant.nickname}`
    : `Mark ${careMeta.label.toLowerCase()} done for ${plant.nickname}`

  return (
    <div className={`flex items-center gap-3 p-3 rounded-md transition-all ${rowClasses}`}>
      <PlantAvatar species={plant.species} size={48} />

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-extrabold text-ink ${done ? 'line-through' : ''}`}>{plant.nickname}</p>
        {voiceQuote && (
          <p className={`text-[13px] italic font-medium text-ink-soft mt-0.5 truncate ${done ? 'line-through' : ''}`}>
            {voiceQuote}
          </p>
        )}
        <div className="flex gap-1.5 mt-1.5">
          <Badge scheme={careMeta.scheme} variant="soft">
            {careMeta.label}
          </Badge>
          {statusMeta && (
            <Badge scheme={statusMeta.scheme} variant="soft">
              {statusMeta.label}
            </Badge>
          )}
        </div>
      </div>

      <Action
        variant="unstyled"
        onClick={onComplete}
        disabled={done}
        aria-pressed={done}
        aria-label={checkLabel}
        className={`shrink-0 w-[30px] h-[30px] rounded-full border-[2.5px] flex items-center justify-center transition-all ${
          done ? 'bg-leaf border-leaf' : 'bg-transparent border-mint hover:border-leaf/60'
        }`}
      >
        {done && <FontAwesomeIcon icon={faCheck} className="text-card text-[11px]" />}
      </Action>
    </div>
  )
}
