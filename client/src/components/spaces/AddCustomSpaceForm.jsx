import { useEffect, useState } from 'react'
import SegmentedControl from '../form/SegmentedControl'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Card from '../ui/Card'
import Dialog from '../ui/Dialog'
import { SPACE_ICON_OPTIONS } from '../../utils/spaceIcons'

const EMPTY_SET = new Set()

export default function AddCustomSpaceForm({
  open,
  onClose,
  onAdd,
  onEdit,
  space = null,
  existingNames = EMPTY_SET,
}) {
  const isEdit = Boolean(space)
  const title = isEdit ? 'Edit space' : 'Add a custom space'
  const submitLabel = isEdit ? 'Save' : 'Add space'

  const [name, setName] = useState('')
  const [category, setCategory] = useState('indoor')
  const [icon, setIcon] = useState(SPACE_ICON_OPTIONS[0].slug)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setName(space?.name ?? '')
    setCategory(space?.category ?? 'indoor')
    setIcon(space?.icon ?? SPACE_ICON_OPTIONS[0].slug)
    setError(null)
  }, [open, space])

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

function IconPicker({ value, onChange }) {
  return (
    <div>
      <span className="block text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.14em] mb-2">
        Icon
      </span>
      <div role="radiogroup" aria-label="Icon" className="grid grid-cols-6 gap-2">
        {SPACE_ICON_OPTIONS.map((option) => {
          const checked = option.slug === value
          return (
            <button
              key={option.slug}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={option.label}
              onClick={() => onChange(option.slug)}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-shadow cursor-pointer ${
                checked
                  ? 'bg-mint text-emerald shadow-warm-sm ring-2 ring-inset ring-emerald'
                  : 'bg-paper-deep text-ink-soft hover:bg-mint/60'
              }`}
            >
              <span aria-hidden="true">{option.emoji}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
