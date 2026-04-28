import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import Select from '../../form/Select'
import TextInput from '../../form/TextInput'
import Action from '../../ui/Action'
import Card from '../../ui/Card'
import Dialog from '../../ui/Dialog'

const TITLE = 'Add a plant'

export default function AddPlantForm({
  open,
  onClose,
  onAdd,
  species,
  availableSpaces = [],
  existingNicknames = [],
  submitting = false,
}) {
  const [nickname, setNickname] = useState('')
  const [chosenSpaceId, setChosenSpaceId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || !species) return

    setNickname(species.common_name ?? '')
    setChosenSpaceId(availableSpaces.length === 1 ? availableSpaces[0].id : null)
    setError(null)
  }, [open, species, availableSpaces])

  function handleAdd() {
    if (!species) return
    const trimmed = nickname.trim()
    if (!trimmed) return

    if (existingNicknames.includes(trimmed)) {
      setError({ field: 'nickname', message: `"${trimmed}" is already in your list — pick a different name.` })
      return
    }
    if (!chosenSpaceId) {
      setError({ field: 'space', message: 'Pick a space for this plant.' })
      return
    }
    onAdd({ species, nickname: trimmed, spaceId: chosenSpaceId })
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
        <div className="flex items-center gap-3">
          <span className="text-3xl shrink-0" aria-hidden="true">
            {species?.icon || '🌿'}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-ink truncate">{species?.common_name}</div>
            {species?.scientific_name && (
              <div className="font-display italic text-xs text-ink-soft truncate">{species.scientific_name}</div>
            )}
          </div>
        </div>

        <TextInput
          label="Nickname"
          type="text"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Monty, Spike, Basil…"
          error={error?.field === 'nickname' ? error.message : null}
          autoFocus
        />

        {availableSpaces.length > 1 && (
          <Select
            label="Space"
            value={chosenSpaceId ?? ''}
            onChange={(event) => {
              setChosenSpaceId(Number(event.target.value))
              if (error) setError(null)
            }}
            error={error?.field === 'space' ? error.message : null}
          >
            <option value="" disabled>
              Pick a space…
            </option>
            {availableSpaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </Select>
        )}
      </Card.Body>

      <Card.Footer divider={false} className="flex gap-2.5">
        <Action variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Action>
        <Action variant="primary" onClick={handleAdd} disabled={!nickname.trim() || submitting} className="ml-auto">
          {submitting ? 'Adding…' : 'Add plant'}
        </Action>
      </Card.Footer>
    </Dialog>
  )
}
