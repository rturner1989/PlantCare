import { useId, useState } from 'react'
import { ValidationError } from '../../../errors/ValidationError'
import { useFormSubmit } from '../../../hooks/useFormSubmit'
import Select from '../../form/Select'
import TextInput from '../../form/TextInput'
import Action from '../../ui/Action'
import Card from '../../ui/Card'
import Dialog from '../../ui/Dialog'

const TITLE = 'Add a plant'

const EMPTY_SET = new Set()

// Caller resets state by re-keying on the species (e.g.
// `<PlantFormDialog key={species?.id ?? 'none'} … />`). Per React's
// modern idiom, key-driven remount avoids a sync useEffect that
// would otherwise leak nickname/space between picks.
export default function PlantFormDialog({
  open,
  onClose,
  onAdd,
  species,
  availableSpaces = [],
  existingNicknames = EMPTY_SET,
}) {
  const titleId = useId()
  const autoPickedSpaceId = availableSpaces.length === 1 ? availableSpaces[0].id : null
  const [nickname, setNickname] = useState(species?.common_name ?? '')
  const [chosenSpaceId, setChosenSpaceId] = useState(autoPickedSpaceId)

  const { submitting, handleSubmit, fieldErrors, formRef } = useFormSubmit({
    action: async () => {
      if (!species) return
      const trimmed = nickname.trim()
      if (!trimmed) throw new ValidationError({ nickname: 'Pick a nickname for your plant.' })
      if (existingNicknames.has(trimmed)) {
        throw new ValidationError({ nickname: `"${trimmed}" is already in your list — pick a different name.` })
      }
      if (!chosenSpaceId) throw new ValidationError({ space: 'Pick a space for this plant.' })

      await onAdd({ species, nickname: trimmed, spaceId: chosenSpaceId })
      onClose()
    },
    errorMessage: "Couldn't add that plant",
  })

  return (
    <Dialog open={open} onClose={onClose} title={TITLE} ariaLabelledBy={titleId}>
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-0">
        <Card.Header divider={false}>
          <p id={titleId} className="text-lg font-extrabold text-ink">
            {TITLE}
          </p>
        </Card.Header>

        <Card.Body className="!flex-none flex flex-col gap-4">
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
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Monty, Spike, Basil…"
            error={fieldErrors.nickname}
            autoFocus
          />

          {availableSpaces.length > 1 && (
            <Select
              label="Space"
              value={chosenSpaceId ?? ''}
              onChange={(event) => setChosenSpaceId(Number(event.target.value))}
              error={fieldErrors.space}
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
          <Action variant="secondary" onClick={onClose} disabled={submitting} type="button">
            Cancel
          </Action>
          <Action variant="primary" type="submit" disabled={!nickname.trim() || submitting} className="ml-auto">
            {submitting ? 'Adding…' : 'Add plant'}
          </Action>
        </Card.Footer>
      </form>
    </Dialog>
  )
}
