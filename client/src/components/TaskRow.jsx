import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PlantAvatar from './PlantAvatar'
import Action from './ui/Action'
import Badge from './ui/Badge'

/**
 * TaskRow — one care task on the Today screen.
 *
 * Shape: plant avatar · (nickname + voice quote + tag pair) · check circle
 *
 * Props:
 *   plant       — Plant payload from the API (needs nickname, species, water_status, feed_status)
 *   careType    — 'watering' | 'feeding' (drives the left tag + which status to read)
 *   voiceQuote  — optional personality-driven line ("I'm wilting…"). Pass from parent, selected
 *                 by personality × care state. TICKET-009 wires this up; MVP callers can omit.
 *   done        — render as complete (leaf-filled check, strikethrough, faded background)
 *   onComplete  — fired when the check button is tapped (creates a CareLog on the server)
 *
 * Disabled while `done` so the button doesn't double-fire on rapid taps;
 * the visible "done" styling is applied via className rather than the
 * default Action 60%-opacity treatment (which would look like a generic
 * disabled button instead of a completed task).
 */

// Labels for the care-type tag on the left. Match backend care_logs.action
// string values so swapping `care_type` through to telemetry later is a
// rename, not a translation.
const CARE_TYPE_META = {
  watering: { label: 'Water', scheme: 'emerald' },
  feeding: { label: 'Feed', scheme: 'sunshine' },
}

// Buckets we render. "healthy" / "unknown" from the backend don't surface
// a status tag — they're non-events on a screen showing things that DO
// need care.
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

  // Three visual states (in order of precedence): done → overdue → normal.
  // Done wins because once the task is marked complete the urgency is
  // moot; showing a coral-tinted completed row would be noisy.
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
