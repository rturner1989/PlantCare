import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SegmentedControl from '../components/form/SegmentedControl'
import AddCustomSpaceForm from '../components/spaces/AddCustomSpaceForm'
import ListView from '../components/spaces/ListView'
import RoomsView from '../components/spaces/RoomsView'
import Action from '../components/ui/Action'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import { usePlants } from '../hooks/usePlants'
import { useCreateSpace, useSpaces, useUpdateSpace } from '../hooks/useSpaces'
import { useWeather } from '../hooks/useWeather'
import { pluralize } from '../utils/pluralize'

const VIEW_OPTIONS = [
  { value: 'rooms', label: 'Rooms', icon: '⊞' },
  { value: 'list', label: 'List', icon: '☰' },
  { value: 'habitat', label: 'Habitat', icon: '🏠', disabled: true, phase: 'P3' },
]

const VIEW_STORAGE_KEY = 'house.view'

// Module-level cache so House doesn't hit sessionStorage on every render.
// Lazy-loaded on first read, kept in sync by writeStoredView.
let cachedStoredView = null
let cachedStoredViewLoaded = false

function isOverdue(plant) {
  return plant.water_status === 'overdue' || plant.feed_status === 'overdue'
}

function readStoredView() {
  if (cachedStoredViewLoaded) return cachedStoredView
  cachedStoredViewLoaded = true
  if (typeof window === 'undefined') return null
  cachedStoredView = window.sessionStorage.getItem(VIEW_STORAGE_KEY)
  return cachedStoredView
}

function writeStoredView(value) {
  cachedStoredView = value
  cachedStoredViewLoaded = true
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(VIEW_STORAGE_KEY, value)
}

export default function House() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlView = searchParams.get('view')
  const storedView = readStoredView()
  const view = urlView === 'list' || urlView === 'rooms' ? urlView : storedView === 'list' ? 'list' : 'rooms'
  const filteredSpaceId = searchParams.get('space_id') ? Number(searchParams.get('space_id')) : null
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogState, setDialogState] = useState({ open: false, space: null })
  const { data: spaces, isLoading: spacesLoading, error: spacesError, refetch: refetchSpaces } = useSpaces()
  const { data: plants, isLoading: plantsLoading, error: plantsError, refetch: refetchPlants } = usePlants()
  const { today: weatherToday } = useWeather()
  const createSpace = useCreateSpace()
  const updateSpace = useUpdateSpace()

  const isLoading = spacesLoading || plantsLoading
  const error = spacesError || plantsError

  const totalSpaces = spaces?.length ?? 0
  const totalPlants = plants?.length ?? 0
  const overdueCount = (plants ?? []).reduce((acc, plant) => acc + (isOverdue(plant) ? 1 : 0), 0)
  const existingNames = useMemo(() => new Set(spaces?.map((space) => space.name) ?? []), [spaces])

  function setView(next) {
    writeStoredView(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === 'rooms') {
          params.delete('view')
          params.delete('space_id')
        } else {
          params.set('view', next)
        }
        return params
      },
      { replace: true },
    )
  }

  function selectSpace(space) {
    writeStoredView('list')
    setSearchParams({ view: 'list', space_id: String(space.id) })
  }

  function clearSpaceFilter() {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        params.delete('space_id')
        return params
      },
      { replace: true },
    )
  }

  function handleAddSpace(name, category, icon) {
    createSpace.mutate({ name, icon, category })
  }

  function handleEditSpace(id, name, category, icon) {
    updateSpace.mutate({ id, name, category, icon })
  }

  function openAddDialog() {
    setDialogState({ open: true, space: null })
  }

  function openEditDialog(space) {
    setDialogState({ open: true, space })
  }

  function closeDialog() {
    setDialogState((prev) => ({ ...prev, open: false }))
  }

  const meta =
    totalSpaces > 0
      ? [
          pluralize(totalPlants, 'plant'),
          pluralize(totalSpaces, 'space'),
          overdueCount > 0 && `${overdueCount} ${overdueCount === 1 ? 'needs' : 'need'} attention`,
        ]
          .filter(Boolean)
          .join(' · ')
      : null

  return (
    <div className="flex flex-col gap-5 lg:gap-7 px-3 lg:px-6 py-4 lg:py-6 overflow-x-hidden">
      <PageHeader
        eyebrow="Your greenhouse"
        meta={meta}
        actions={
          <SegmentedControl label="View as" labelHidden value={view} onChange={setView} options={VIEW_OPTIONS} />
        }
      >
        Browse your <em className="text-emerald">plants</em>
      </PageHeader>
      {isLoading && (
        <div role="status" aria-label="Loading your house" className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <EmptyState
          title="We couldn't load your house"
          description="Something went wrong fetching your spaces and plants."
          action={
            <Action
              variant="secondary"
              onClick={() => {
                refetchSpaces()
                refetchPlants()
              }}
            >
              Try again
            </Action>
          }
        />
      )}

      {!isLoading && !error && view === 'rooms' && (
        <RoomsView
          spaces={spaces ?? []}
          plants={plants ?? []}
          weatherToday={weatherToday}
          onAddSpace={openAddDialog}
          onEditSpace={openEditDialog}
          onSelectSpace={selectSpace}
        />
      )}

      {!isLoading && !error && view === 'list' && (
        <ListView
          spaces={spaces ?? []}
          plants={plants ?? []}
          weatherToday={weatherToday}
          filteredSpaceId={filteredSpaceId}
          onClearFilter={clearSpaceFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddSpace={openAddDialog}
        />
      )}

      <AddCustomSpaceForm
        key={dialogState.space?.id ?? 'new'}
        open={dialogState.open}
        onClose={closeDialog}
        onAdd={handleAddSpace}
        onEdit={handleEditSpace}
        space={dialogState.space}
        existingNames={existingNames}
      />
    </div>
  )
}
