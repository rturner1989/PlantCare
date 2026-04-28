import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'

// Hidden radios inside labels — native arrow-key navigation + form semantics
// for free. The active pill slides between positions via a shared layoutId.

const TRACK = 'flex gap-[3px] mt-2 bg-paper-deep border border-paper-edge p-[3px] rounded-md'
const LABEL = 'flex items-center gap-1.5 text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.14em]'
const OPTION_BASE =
  'relative flex-1 flex items-center justify-center py-2 rounded-[11px] text-xs capitalize transition-colors duration-200'
const OPTION_ACTIVE = 'text-forest font-bold'
const OPTION_INACTIVE = 'text-ink-soft font-medium'
const OPTION_ENABLED = 'cursor-pointer'
const OPTION_DISABLED = 'cursor-not-allowed opacity-50'
const PILL = 'absolute inset-0 bg-paper rounded-[11px] shadow-[var(--shadow-warm-sm)]'
const SPRING = { type: 'spring', stiffness: 400, damping: 30 }

function normalizeOption(option) {
  if (typeof option === 'string') return { value: option, label: option }
  return option
}

export default function SegmentedControl({ icon, label, value, onChange, options, className = '' }) {
  const groupName = useId()
  // Unique per instance — Step 4 stacks three, a shared layoutId would
  // animate the pill between unrelated controls.
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
          const isDisabled = Boolean(option.disabled)
          return (
            <label
              key={option.value}
              className={`${OPTION_BASE} ${isActive ? OPTION_ACTIVE : OPTION_INACTIVE} ${isDisabled ? OPTION_DISABLED : OPTION_ENABLED}`}
              title={option.hint}
            >
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isActive}
                disabled={isDisabled}
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
              <span className="relative">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
