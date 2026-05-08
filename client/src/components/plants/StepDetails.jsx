import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../../api/client'
import { ValidationError } from '../../errors/ValidationError'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { useCreatePlant } from '../../hooks/usePlants'
import { useSpaces } from '../../hooks/useSpaces'
import { formatSpaceName, getSpaceEmoji } from '../../utils/spaceIcons'
import Select from '../form/Select'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Card from '../ui/Card'

export default function StepDetails({ species, defaultSpaceId = null, onBack, onSubmitSuccess }) {
  const { data: spaces = [] } = useSpaces()
  const createPlant = useCreatePlant()

  const activeSpaces = useMemo(() => spaces.filter((space) => !space.archived_at), [spaces])

  const initialSpaceId = useMemo(() => {
    if (defaultSpaceId && activeSpaces.some((space) => space.id === defaultSpaceId)) return defaultSpaceId
    if (activeSpaces.length === 1) return activeSpaces[0].id
    return null
  }, [defaultSpaceId, activeSpaces])

  const [nickname, setNickname] = useState(species?.common_name ?? '')
  const [chosenSpaceId, setChosenSpaceId] = useState(initialSpaceId)

  // Auto-pick the only available space once it loads. The initial
  // useState ran with an empty list when StepDetails mounted before
  // useSpaces settled — this effect catches the post-mount arrival.
  // Don't list `chosenSpaceId` as a dep: the inner condition guards
  // against re-set, and including it would re-fire the effect on every
  // user change to the picker (the read is fine stale).
  // biome-ignore lint/correctness/useExhaustiveDependencies: chosenSpaceId read is intentionally stale — see comment above
  useEffect(() => {
    if (chosenSpaceId == null && initialSpaceId != null) {
      setChosenSpaceId(initialSpaceId)
    }
  }, [initialSpaceId])

  const lockedSpace = defaultSpaceId == null ? null : activeSpaces.find((space) => space.id === defaultSpaceId)

  const { submitting, handleSubmit, fieldErrors, formRef } = useFormSubmit({
    action: async () => {
      const trimmed = nickname.trim()
      if (!trimmed) throw new ValidationError({ nickname: 'Pick a nickname for your plant.' })
      if (!chosenSpaceId) throw new ValidationError({ space: 'Pick a space for this plant.' })

      // Perenual results arrive with id=null. Hydrate via the show endpoint
      // first — the controller persists the Perenual row on first call.
      let resolvedSpecies = species
      if (!resolvedSpecies.id && resolvedSpecies.perenual_id) {
        const params = new URLSearchParams({
          perenual_id: resolvedSpecies.perenual_id,
          common_name: resolvedSpecies.common_name ?? '',
          scientific_name: resolvedSpecies.scientific_name ?? '',
          image_url: resolvedSpecies.image_url ?? '',
        })
        resolvedSpecies = await apiGet(`/api/v1/species/${resolvedSpecies.perenual_id}?${params}`)
      }
      const plant = await createPlant.mutateAsync({
        species_id: resolvedSpecies.id,
        space_id: chosenSpaceId,
        nickname: trimmed,
      })
      onSubmitSuccess(plant)
    },
    errorMessage: "Couldn't add that plant",
  })

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-4">
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

        {lockedSpace && (
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">
            Adding to <span aria-hidden="true">{getSpaceEmoji(lockedSpace.icon)}</span>{' '}
            <span className="text-ink normal-case tracking-normal font-display italic text-sm">
              {formatSpaceName(lockedSpace.name)}
            </span>
          </p>
        )}

        <TextInput
          label="Nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Monty, Spike, Basil…"
          error={fieldErrors.nickname}
          autoFocus
        />

        {defaultSpaceId == null && activeSpaces.length > 1 && (
          <Select
            label="Space"
            value={chosenSpaceId ?? ''}
            onChange={(event) => setChosenSpaceId(Number(event.target.value))}
            error={fieldErrors.space}
          >
            <option value="" disabled>
              Pick a space…
            </option>
            {activeSpaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </Select>
        )}
      </Card.Body>

      <Card.Footer divider={false} className="flex gap-2.5">
        <Action variant="secondary" onClick={onBack} disabled={submitting} type="button">
          Back
        </Action>
        <Action variant="primary" type="submit" disabled={!nickname.trim() || submitting} className="ml-auto">
          {submitting ? 'Adding…' : 'Add plant'}
        </Action>
      </Card.Footer>
    </form>
  )
}
