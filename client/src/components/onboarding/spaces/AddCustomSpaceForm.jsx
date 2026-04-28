import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import SegmentedControl from '../../form/SegmentedControl'
import TextInput from '../../form/TextInput'
import Action from '../../ui/Action'
import Card from '../../ui/Card'
import Dialog from '../../ui/Dialog'

const TITLE = 'Add a custom space'

const EMPTY_SET = new Set()

export default function AddCustomSpaceForm({ open, onClose, onAdd, existingNames = EMPTY_SET }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('indoor')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setName('')
      setCategory('indoor')
      setError(null)
    }
  }, [open])

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return

    if (existingNames.has(trimmed)) {
      setError({ field: 'name', message: `"${trimmed}" is already in your list.` })
      return
    }
    onAdd(trimmed, category)
    onClose()
  }

  function handleKeyDown(event) {
    if (event.key !== 'Enter' && event.key !== 'Escape') return

    event.preventDefault()
    if (event.key === 'Enter') {
      handleAdd()
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={TITLE}>
      <Card.Header divider={false} className="flex items-center justify-between gap-3">
        <p className="text-lg font-extrabold text-ink">{TITLE}</p>
        <Action
          variant="unstyled"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-mint/60 transition-colors"
        >
          <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
        </Action>
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
      </Card.Body>

      <Card.Footer divider={false} className="flex gap-2.5">
        <Action variant="secondary" onClick={onClose}>
          Cancel
        </Action>
        <Action variant="primary" onClick={handleAdd} disabled={!name.trim()} className="ml-auto">
          Add space
        </Action>
      </Card.Footer>
    </Dialog>
  )
}
