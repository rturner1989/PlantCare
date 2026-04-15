import { useId } from 'react'

/**
 * SegmentedControl — a pill-shaped radiogroup for mutually-exclusive choices.
 *
 * Used for short option sets where all values should be visible at once and
 * the user picks exactly one (e.g. "low / medium / bright" light level). For
 * longer lists, reach for a Select primitive instead.
 *
 * Options accept either strings or {value, label} objects so callers can
 * pass a shorthand when display === value:
 *
 *   <SegmentedControl
 *     label="Light"
 *     value={light}
 *     onChange={setLight}
 *     options={['low', 'medium', 'bright']}
 *   />
 *
 *   <SegmentedControl
 *     label="Humidity"
 *     value={humidity}
 *     onChange={setHumidity}
 *     options={[
 *       { value: 'dry', label: 'Dry' },
 *       { value: 'average', label: 'Average' },
 *       { value: 'humid', label: 'Humid' },
 *     ]}
 *   />
 *
 * Each option is a real `<input type="radio">` visually hidden behind a
 * clickable <label> — so the browser handles focus, keyboard navigation
 * (arrow keys move between options within the group), and form submission
 * semantics natively. `name` is generated with useId so multiple segmented
 * controls on the same page don't clash.
 */

const TRACK = 'flex gap-1 mt-2 bg-mint p-1 rounded-full'
const LABEL = 'text-xs font-bold text-ink-soft uppercase tracking-wider'
const OPTION_BASE =
  'flex-1 flex items-center justify-center py-2 rounded-full text-xs font-bold cursor-pointer capitalize transition-all'
const OPTION_ACTIVE = 'bg-card text-ink shadow-sm'
const OPTION_INACTIVE = 'bg-transparent text-ink-soft'

function normalizeOption(option) {
  if (typeof option === 'string') return { value: option, label: option }
  return option
}

export default function SegmentedControl({ label, value, onChange, options, className = '' }) {
  const groupName = useId()
  const normalized = options.map(normalizeOption)

  return (
    <div className={`mb-5 ${className}`}>
      {label && <span className={LABEL}>{label}</span>}
      <div className={TRACK} role="radiogroup" aria-label={label}>
        {normalized.map((option) => {
          const isActive = option.value === value
          return (
            <label key={option.value} className={`${OPTION_BASE} ${isActive ? OPTION_ACTIVE : OPTION_INACTIVE}`}>
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isActive}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
