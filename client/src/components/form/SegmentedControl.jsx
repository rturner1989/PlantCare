import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

/**
 * Pill radiogroup for short mutually-exclusive option sets. Each option
 * is a hidden real radio input inside a <label> so native arrow-key
 * navigation and form semantics come for free; useId gives each instance
 * its own radio `name` so stacked controls on one page don't collide.
 *
 *   <SegmentedControl label="Light" value={light} onChange={setLight}
 *     options={['low', 'medium', 'bright']} />
 *
 * The active white "pill" behind the selected option slides between
 * positions iOS-style rather than snapping: a single motion element with
 * a shared `layoutId` unmounts from the old label and mounts in the new
 * one, and Framer Motion animates the position change via a spring
 * (respects `prefers-reduced-motion`).
 */

const TRACK = 'flex gap-1.5 mt-2 bg-mint p-1 rounded-md'
const LABEL = 'flex items-center gap-1.5 text-xs font-bold text-ink-soft uppercase tracking-wider'
// `relative` so the absolutely-positioned pill sits within the option.
// `transition-colors duration-200` on the label text follows the pill's
// spring so the colour shift doesn't lag behind the slide.
const OPTION_BASE =
  'relative flex-1 flex items-center justify-center py-2 rounded-sm text-xs font-bold cursor-pointer capitalize transition-colors duration-200'
const OPTION_ACTIVE = 'text-forest'
const OPTION_INACTIVE = 'text-ink-soft'
const PILL = 'absolute inset-0 bg-card rounded-sm shadow-sm'
// iOS 26-style snappy spring — subtle overshoot, fast settle.
const SPRING = { type: 'spring', stiffness: 400, damping: 30 }

function normalizeOption(option) {
  if (typeof option === 'string') return { value: option, label: option }
  return option
}

export default function SegmentedControl({ icon, label, value, onChange, options, className = '' }) {
  const groupName = useId()
  // layoutId has to be unique per SegmentedControl instance or Framer will
  // try to animate the same pill between unrelated controls stacked on one
  // page (Step 4 has three).
  const pillLayoutId = useId()
  const shouldReduceMotion = useReducedMotion()
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
              {isActive && (
                <motion.span
                  layoutId={pillLayoutId}
                  className={PILL}
                  transition={shouldReduceMotion ? { duration: 0 } : SPRING}
                  aria-hidden="true"
                />
              )}
              {/* `relative` lifts the label text above the pill's background. */}
              <span className="relative">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
