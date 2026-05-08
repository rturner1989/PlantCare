import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'
import { apiGet } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCreatePlant, useDeletePlant, usePlants } from '../../hooks/usePlants'
import { isSearchQuery, useSpeciesSearch } from '../../hooks/useSpecies'
import TextInput from '../form/TextInput'
import Tile from '../form/Tile'
import Action from '../ui/Action'
import Card from '../ui/Card'
import Emphasis from '../ui/Emphasis'
import EmptyState from '../ui/EmptyState'
import Heading from '../ui/Heading'
import Spinner from '../ui/Spinner'
import PlantFormDialog from './plants/PlantFormDialog'
import StepTip from './shared/StepTip'
import WizardActions from './shared/WizardActions'

const EMPTY_RESULTS = []

function speciesKey(species) {
  return species.id ?? species.perenual_id ?? species.common_name
}

export default function Step3Plants({ availableSpaces = [], onBack, onComplete }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [pendingSpecies, setPendingSpecies] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const debouncedQuery = useDebouncedValue(query, 300)
  const isSearching = isSearchQuery(debouncedQuery)
  const { data: results = EMPTY_RESULTS, isLoading } = useSpeciesSearch(debouncedQuery)

  const modeChanging = isSearchQuery(query) !== isSearching
  const visibleResults = modeChanging ? EMPTY_RESULTS : results
  const loading = isLoading || query !== debouncedQuery

  // Eager-commit pattern — `usePlants()` is the source of truth for added
  // plants, so back nav restores chips automatically and refreshes match
  // server state. Local state only tracks the in-flight dialog.
  const { data: addedPlants = [] } = usePlants()
  const createPlant = useCreatePlant()
  const deletePlant = useDeletePlant()

  // Memoised so PlantFormDialog gets a stable Set ref when the plant list
  // hasn't changed — keeps its useEffect deps tight + dup check is O(1).
  const existingNicknames = useMemo(() => new Set(addedPlants.map((plant) => plant.nickname)), [addedPlants])

  function handleSpeciesTap(species) {
    setPendingSpecies(species)
    setDialogOpen(true)
  }

  async function handleConfirmAdd({ species, nickname, spaceId }) {
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
    await createPlant.mutateAsync({
      species_id: resolvedSpecies.id,
      space_id: spaceId,
      nickname,
    })
    setQuery('')
  }

  function handleRemove(plantId) {
    deletePlant.mutate(plantId, {
      onError: (err) => toast.error(err.message ?? "Couldn't remove that plant"),
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    onComplete(addedPlants)
  }

  const plantCount = addedPlants.length
  const continueLabel =
    plantCount === 0
      ? 'Continue'
      : plantCount === 1
        ? 'Continue with 1 plant →'
        : `Continue with ${plantCount} plants →`

  return (
    <>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-4">
        <Card.Header divider={false}>
          <Heading
            variant="display"
            className="text-ink"
            subtitle="Add the ones sharing your home already — you can always add more later."
          >
            Meet your <Emphasis>plants</Emphasis>
          </Heading>
          <div className="mt-4">
            <StepTip icon="🌿">Start small — three well-kept beats ten forgotten.</StepTip>
          </div>
        </Card.Header>

        <Card.Body className="flex flex-col gap-4">
          {addedPlants.length > 0 && (
            <ul
              aria-live="polite"
              aria-label={`${addedPlants.length} ${addedPlants.length === 1 ? 'plant' : 'plants'} added`}
              className="flex flex-wrap gap-2 p-2.5 bg-mint border-[1.5px] border-dashed border-leaf/25 rounded-md list-none"
            >
              {addedPlants.map((plant) => (
                <li
                  key={plant.id}
                  className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 bg-paper rounded-full shadow-warm-sm text-xs font-bold"
                >
                  <span className="w-5 h-5 rounded-full bg-paper-deep border border-paper-edge flex items-center justify-center text-[11px]">
                    {plant.species?.icon || '🌿'}
                  </span>
                  <span className="text-ink">{plant.nickname}</span>
                  {plant.species?.common_name && (
                    <span className="text-ink-soft font-medium text-[10px]">
                      · {plant.species.common_name} · {plant.space?.name}
                    </span>
                  )}
                  <Action
                    variant="unstyled"
                    onClick={() => handleRemove(plant.id)}
                    aria-label={`Remove ${plant.nickname}`}
                    className="w-3.5 h-3.5 rounded-full bg-ink/5 text-ink-soft text-[10px] flex items-center justify-center hover:bg-ink/10"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-2 h-2" />
                  </Action>
                </li>
              ))}
            </ul>
          )}

          <TextInput
            label="Search species"
            labelHidden
            type="search"
            placeholder="Search species…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div>
            {loading && visibleResults.length === 0 ? (
              <div role="status" aria-label="Searching species" className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : visibleResults.length === 0 && isSearching ? (
              <EmptyState
                description={
                  <>
                    Nothing matches <span className="font-bold text-ink">"{debouncedQuery}"</span>. Try a different
                    name.
                  </>
                }
              />
            ) : (
              <div className="text-left">
                <p className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-ink-soft mb-2.5">
                  {isSearching ? 'Results · tap to add' : 'Popular · tap to add'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {visibleResults.map((species) => (
                    <Tile key={speciesKey(species)} size="card" onClick={() => handleSpeciesTap(species)}>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate">{species.common_name}</div>
                        {species.scientific_name && (
                          <div className="font-display italic text-xs text-ink-soft truncate">
                            {species.scientific_name}
                          </div>
                        )}
                      </div>
                    </Tile>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card.Body>

        <WizardActions onBack={onBack} continueLabel={continueLabel} />
      </form>

      <PlantFormDialog
        key={pendingSpecies?.id ?? pendingSpecies?.perenual_id ?? pendingSpecies?.common_name ?? 'none'}
        open={dialogOpen}
        species={pendingSpecies}
        availableSpaces={availableSpaces}
        existingNicknames={existingNicknames}
        onClose={() => setDialogOpen(false)}
        onAdd={handleConfirmAdd}
      />
    </>
  )
}
