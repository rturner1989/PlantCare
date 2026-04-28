import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useId, useState } from 'react'
import SegmentedControl from '../../form/SegmentedControl'
import Action from '../../ui/Action'
import Card from '../../ui/Card'
import Dialog from '../../ui/Dialog'

const TITLE = 'Add a custom space'

export default function CustomSpaceForm({ open, onClose, onAdd, existingNames = [] }) {
  const errorId = useId()
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

    if (existingNames.includes(trimmed)) {
      setError(`"${trimmed}" is already in your list.`)
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

      <Card.Body className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-ink-soft">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Garage, Loft, Greenhouse…"
            className={`px-3 py-2.5 rounded-md bg-paper border-[1.5px] text-ink text-sm outline-none focus:border-emerald ${
              error ? 'border-coral-deep' : 'border-paper-edge'
            }`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            autoFocus
          />
        </label>

        <SegmentedControl
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { value: 'indoor', label: 'Indoor' },
            { value: 'outdoor', label: 'Outdoor' },
          ]}
        />

        {error && (
          <p id={errorId} role="alert" className="text-sm text-coral-deep font-medium">
            {error}
          </p>
        )}
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
