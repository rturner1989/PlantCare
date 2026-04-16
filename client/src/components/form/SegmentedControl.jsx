import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useId } from 'react'

/**
 * Pill radiogroup for short mutually-exclusive option sets. Each option
 * is a hidden real radio input inside a <label> so native arrow-key
 * navigation and form semantics come for free; useId gives each instance
 * its own radio `name` so stacked controls on one page don't collide.
 *
 * `options` accepts strings or {value, label} objects:
 *
 *   <SegmentedControl label="Light" value={light} onChange={setLight}
 *     options={['low', 'medium', 'bright']} />
 */

const TRACK = 'flex gap-1.5 mt-2 bg-mint p-1 rounded-md'
const LABEL = 'flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider'
const OPTION_BASE =
  'flex-1 flex items-center justify-center py-2 rounded-sm text-xs font-bold cursor-pointer capitalize transition-all'
const OPTION_ACTIVE = 'bg-card text-forest shadow-sm'
const OPTION_INACTIVE = 'bg-transparent text-ink-soft'

function normalizeOption(option) {
  if (typeof option === 'string') return { value: option, label: option }
  return option
}

export default function SegmentedControl({ icon, label, value, onChange, options, className = '' }) {
  const groupName = useId()
  const normalized = options.map(normalizeOption)

  return (
    <div className={`mb-5 ${className}`}>
      {label && (
        <span className={LABEL}>
          {icon && <FontAwesomeIcon icon={icon} className="text-sm text-emerald" aria-hidden="true" />}
          {label}
        </span>
      )}
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
