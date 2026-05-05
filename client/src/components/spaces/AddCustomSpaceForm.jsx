import { useState } from 'react'
import { SPACE_ICON_OPTIONS } from '../../utils/spaceIcons'
import SegmentedControl from '../form/SegmentedControl'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Card from '../ui/Card'
import Dialog from '../ui/Dialog'

const EMPTY_SET = new Set()

// Caller resets state by re-keying the component on the editing target
// (e.g. <AddCustomSpaceForm key={space?.id ?? 'new'} … />). Per React's
// modern idiom, key-driven remount avoids the open/space sync useEffect
// that would otherwise leak state between Add and Edit modes.
export default function AddCustomSpaceForm({ open, onClose, onAdd, onEdit, space = null, existingNames = EMPTY_SET }) {
  const isEdit = Boolean(space)
  const title = isEdit ? 'Edit space' : 'Add a custom space'
  const submitLabel = isEdit ? 'Save' : 'Add space'

  const [name, setName] = useState(space?.name ?? '')
  const [category, setCategory] = useState(space?.category ?? 'indoor')
  const [icon, setIcon] = useState(space?.icon ?? SPACE_ICON_OPTIONS[0].slug)
  const [error, setError] = useState(null)

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return

    const isUnchangedName = isEdit && trimmed === space.name
    if (!isUnchangedName && existingNames.has(trimmed)) {
      setError({ field: 'name', message: `"${trimmed}" is already in your list.` })
      return
    }

    if (isEdit) {
      onEdit(space.id, trimmed, category, icon)
    } else {
      onAdd(trimmed, category, icon)
    }
    onClose()
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== 'Escape') return

    event.preventDefault()
    if (event.key === 'Enter') {
      handleSubmit()
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <Card.Header divider={false}>
        <p className="text-lg font-extrabold text-ink">{title}</p>
      </Card.Header>

      <Card.Body className="!flex-none flex flex-col gap-4">
        <TextInput
          label="Name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Garage, Loft, Greenhouse…"
          error={error?.field === 'name' ? error.message : null}
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
      </Card.Body>

      <Card.Footer divider={false} className="flex gap-2.5">
        <Action variant="secondary" onClick={onClose}>
          Cancel
        </Action>
        <Action variant="primary" onClick={handleSubmit} disabled={!name.trim()} className="ml-auto">
          {submitLabel}
        </Action>
      </Card.Footer>
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
