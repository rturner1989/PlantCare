import { faCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * SinceRibbon — compact "since you were gone" strip at the top of Today.
 *
 * Two visual modes driven by the `urgent` boolean:
 *   urgent=true  → coral alert circle + triangle icon ("3 things changed")
 *   urgent=false → leaf circle + check icon          ("You're on top of things")
 *
 * The icon is decorative — the title/subtitle carry the message, so
 * FontAwesomeIcon stays `aria-hidden` by default. `time` renders
 * right-aligned as small meta (e.g. "18h ago").
 *
 * Not interactive — it's informational, not a button. If a future design
 * makes the whole ribbon clickable, wrap it in an Action at the call site.
 *
 *   <SinceRibbon urgent title="3 things changed" subtitle="Monty's mood dropped" time="18h ago" />
 */
export default function SinceRibbon({ urgent = false, title, subtitle, time }) {
  const icon = urgent ? faTriangleExclamation : faCheck
  const iconBg = urgent ? 'bg-coral' : 'bg-leaf'

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-mint">
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-card ${iconBg}`}>
        <FontAwesomeIcon icon={icon} className="text-xs" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        {subtitle && <p className="text-[11px] font-medium text-ink-soft mt-0.5 truncate">{subtitle}</p>}
      </div>

      {time && <span className="text-[11px] font-semibold text-ink-soft shrink-0">{time}</span>}
    </div>
  )
}
