import { faDroplet, faSun, faTemperatureHalf } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useId, useState } from 'react'
import { ValidationError } from '../../errors/ValidationError'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { SPACE_ICON_OPTIONS } from '../../utils/spaceIcons'
import SegmentedControl from '../form/SegmentedControl'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Card from '../ui/Card'
import Dialog from '../ui/Dialog'

const EMPTY_SET = new Set()

const ENV_AXES = [
  { key: 'light_level', label: 'Light', icon: faSun, options: ['low', 'medium', 'bright'], default: 'medium' },
  {
    key: 'temperature_level',
    label: 'Temperature',
    icon: faTemperatureHalf,
    options: ['cool', 'average', 'warm'],
    default: 'average',
  },
  {
    key: 'humidity_level',
    label: 'Humidity',
    icon: faDroplet,
    options: ['dry', 'average', 'humid'],
    default: 'average',
  },
]

function capitalise(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

// Caller resets state by re-keying the component on the editing target
// (e.g. <SpaceFormDialog key={space?.id ?? 'new'} … />). Per React's
// modern idiom, key-driven remount avoids the open/space sync useEffect
// that would otherwise leak state between Add and Edit modes.
//
// `showEnvironment` defaults true. Onboarding's Step2 passes false
// because Step4Environment walks env per-space afterwards — env
// segments here would be redundant in that flow.
export default function SpaceFormDialog({
  open,
  onClose,
  onAdd,
  onEdit,
  space = null,
  existingNames = EMPTY_SET,
  showEnvironment = true,
}) {
  const isEdit = Boolean(space)
  const title = isEdit ? 'Edit space' : 'Add a custom space'
  const submitLabel = isEdit ? 'Save' : 'Add space'

  const titleId = useId()
  const [name, setName] = useState(space?.name ?? '')
  const [category, setCategory] = useState(space?.category ?? 'indoor')
  const [icon, setIcon] = useState(space?.icon ?? SPACE_ICON_OPTIONS[0].slug)
  const [env, setEnv] = useState(() =>
    Object.fromEntries(ENV_AXES.map((axis) => [axis.key, space?.[axis.key] ?? axis.default])),
  )

  const { submitting, handleSubmit, fieldErrors, formRef } = useFormSubmit({
    action: async () => {
      const trimmed = name.trim()
      if (!trimmed) throw new ValidationError({ name: 'Name required.' })

      const isUnchangedName = isEdit && trimmed === space.name
      if (!isUnchangedName && existingNames.has(trimmed)) {
        throw new ValidationError({ name: `"${trimmed}" is already in your list.` })
      }

      const payload = { name: trimmed, category, icon, ...(showEnvironment ? env : {}) }
      if (isEdit) {
        await onEdit(space.id, payload)
      } else {
        await onAdd(payload)
      }
      onClose()
    },
    errorMessage: isEdit ? "Couldn't save space" : "Couldn't add space",
  })

  return (
    <Dialog open={open} onClose={onClose} title={title} ariaLabelledBy={titleId}>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
        <Card.Header divider={false}>
          <p id={titleId} className="text-lg font-extrabold text-ink">
            {title}
          </p>
        </Card.Header>

        <Card.Body className="!flex-none flex flex-col gap-4">
          <TextInput
            label="Name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Garage, Loft, Greenhouse…"
            error={fieldErrors.name}
            autoFocus
          />

          <SegmentedControl
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'indoor', label: 'Indoor' },
              { value: 'outdoor', label: 'Outdoor' },
            ]}
          />

          <IconPicker value={icon} onChange={setIcon} />

          {showEnvironment &&
            ENV_AXES.map((axis) => (
              <SegmentedControl
                key={axis.key}
                label={
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={axis.icon} aria-hidden="true" className="w-3 h-3" />
                    {axis.label}
                  </span>
                }
                value={env[axis.key]}
                onChange={(next) => setEnv((prev) => ({ ...prev, [axis.key]: next }))}
                options={axis.options.map((option) => ({ value: option, label: capitalise(option) }))}
                density="equal"
              />
            ))}
        </Card.Body>

        <Card.Footer divider={false} className="flex gap-2.5">
          <Action variant="secondary" onClick={onClose} disabled={submitting} type="button">
            Cancel
          </Action>
          <Action variant="primary" type="submit" disabled={!name.trim() || submitting} className="ml-auto">
            {submitting ? 'Saving…' : submitLabel}
          </Action>
        </Card.Footer>
      </form>
    </Dialog>
  )
}

// Native radios with sr-only inputs inside `<label>` wrappers — same
// pattern as SegmentedControl. The browser handles arrow-key navigation
// + roving focus across same-name radios for free, and focus-visible
// styling on the visual swatch is driven by the input's focus state via
// Tailwind's `has-[…]` modifier.
function IconPicker({ value, onChange }) {
  return (
    <div>
      <span className="block text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.14em] mb-2">Icon</span>
      <div role="radiogroup" aria-label="Icon" className="grid grid-cols-6 gap-2">
        {SPACE_ICON_OPTIONS.map((option) => {
          const checked = option.slug === value
          return (
            <label
              key={option.slug}
              aria-label={option.label}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-shadow cursor-pointer has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-emerald/30 ${
                checked
                  ? 'bg-mint text-emerald shadow-warm-sm ring-2 ring-inset ring-emerald'
                  : 'bg-paper-deep text-ink-soft hover:bg-mint/60'
              }`}
            >
              <input
                type="radio"
                name="space-icon"
                value={option.slug}
                checked={checked}
                onChange={() => onChange(option.slug)}
                className="sr-only"
              />
              <span aria-hidden="true">{option.emoji}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
