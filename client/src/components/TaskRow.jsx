import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PlantAvatar from './plants/Avatar'
import Action from './ui/Action'

// Keys match backend care_logs.action values — rename-safe for telemetry later.
const CARE_TYPE_META = {
  watering: { label: 'Water', emoji: '💧', defaultColor: 'text-emerald' },
  feeding: { label: 'Feed', emoji: '🍃', defaultColor: 'text-sunshine-deep' },
}

// 'healthy'/'unknown' deliberately absent — Today only surfaces care due.
const STATUS_META = {
  overdue: 'Overdue',
  due_today: 'Due today',
  due_soon: 'Due soon',
}

export default function TaskRow({ plant, careType = 'watering', voiceQuote, done = false, onComplete }) {
  const careMeta = CARE_TYPE_META[careType] ?? CARE_TYPE_META.watering
  const statusKey = careType === 'feeding' ? plant.feed_status : plant.water_status
  const statusLabel = done ? 'Done' : STATUS_META[statusKey]
  const isOverdue = statusKey === 'overdue'

  // done beats overdue — a completed coral-tinted row would be noisy.
  let rowClasses
  if (done) {
    rowClasses = 'bg-mint/40 opacity-75'
  } else if (isOverdue) {
    rowClasses = 'bg-coral/10'
  } else {
    rowClasses = 'bg-transparent'
  }

  let tagColor
  if (done) {
    tagColor = 'text-emerald'
  } else if (isOverdue) {
    tagColor = 'text-coral-deep'
  } else {
    tagColor = careMeta.defaultColor
  }

  const checkLabel = done
    ? `${careMeta.label} done for ${plant.nickname}`
    : `Mark ${careMeta.label.toLowerCase()} done for ${plant.nickname}`

  return (
    <div className={`flex items-center gap-3 p-3 rounded-md transition-all ${rowClasses}`}>
      <PlantAvatar species={plant.species} />

      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-extrabold text-ink ${done ? 'line-through' : ''}`}>{plant.nickname}</p>
        {voiceQuote && (
          <p className={`text-[13px] italic font-medium text-ink-soft mt-0.5 truncate ${done ? 'line-through' : ''}`}>
            {voiceQuote}
          </p>
        )}
        <p className={`mt-1.5 text-[10px] font-extrabold uppercase tracking-[0.06em] ${tagColor}`}>
          {`${careMeta.emoji} ${careMeta.label}${statusLabel ? ` · ${statusLabel}` : ''}`}
        </p>
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
