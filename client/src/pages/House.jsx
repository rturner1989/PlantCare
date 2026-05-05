import { useMemo, useState } from 'react'
import RoomCard from '../components/RoomCard'
import SegmentedControl from '../components/form/SegmentedControl'
import Action from '../components/ui/Action'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Spinner from '../components/ui/Spinner'
import { usePlants } from '../hooks/usePlants'
import { useSpaces } from '../hooks/useSpaces'
import { getSpaceEmoji } from '../utils/spaceIcons'
import { pluralize } from '../utils/pluralize'

const VIEW_OPTIONS = [
  { value: 'rooms', label: 'Rooms', icon: '⊞' },
  { value: 'list', label: 'List', icon: '☰' },
  { value: 'habitat', label: 'Habitat', icon: '🏠', disabled: true, phase: 'P3' },
]

function needsCare(plant) {
  return plant.water_status === 'overdue' || plant.feed_status === 'overdue'
}

function envHintFor(space) {
  if (!space.light_level || !space.humidity_level) return null
  const light = space.light_level.charAt(0).toUpperCase() + space.light_level.slice(1)
  return `${light} · ${space.humidity_level} humidity`
}

function nextCareFor(plants) {
  let best = null
  for (const plant of plants) {
    if (plant.days_until_water != null && (best === null || plant.days_until_water < best.days)) {
      best = { kind: 'water', icon: '💧', plant, days: plant.days_until_water }
    }
    if (plant.days_until_feed != null && (best === null || plant.days_until_feed < best.days)) {
      best = { kind: 'feed', icon: '🌱', plant, days: plant.days_until_feed }
    }
  }
  if (!best) return null

  const { days, plant, icon } = best
  let label
  if (days < 0) {
    const overdue = Math.abs(days)
    label = `${plant.nickname} · ${pluralize(overdue, 'day')} overdue`
  } else if (days === 0) {
    label = `${plant.nickname} · due today`
  } else {
    label = `${plant.nickname} · in ${days}d`
  }
  return { icon, label, overdue: days < 0 }
}

function peekFor(plants) {
  return [...plants]
    .sort((a, b) => (needsCare(a) ? 0 : 1) - (needsCare(b) ? 0 : 1))
    .map((plant) => ({ id: plant.id, species: plant.species, urgent: needsCare(plant) }))
}

function attentionCountFor(plants) {
  return plants.reduce((acc, plant) => acc + (needsCare(plant) ? 1 : 0), 0)
}

export default function House() {
  const [view, setView] = useState('rooms')
  const { data: spaces, isLoading: spacesLoading, error: spacesError, refetch: refetchSpaces } = useSpaces()
  const { data: plants, isLoading: plantsLoading, error: plantsError, refetch: refetchPlants } = usePlants()

  const isLoading = spacesLoading || plantsLoading
  const error = spacesError || plantsError

  const spaceCards = useMemo(() => {
    if (!spaces || !plants) return []
    return spaces.map((space) => {
      const spacePlants = plants.filter((plant) => plant.space?.id === space.id)
      return {
        space,
        plants: spacePlants,
        peek: peekFor(spacePlants),
        nextCare: nextCareFor(spacePlants),
        attention: attentionCountFor(spacePlants),
      }
    })
  }, [spaces, plants])

  const totalSpaces = spaces?.length ?? 0
  const totalPlants = plants?.length ?? 0
  const overdueCount = spaceCards.reduce((acc, card) => acc + card.attention, 0)

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
    <div className="flex flex-col flex-1 min-h-0 gap-5 lg:gap-7 px-3 lg:px-6 py-4 lg:py-6">
      <PageHeader
        eyebrow="Your greenhouse"
        meta={meta}
        actions={
          <SegmentedControl
            label="View as"
            labelHidden
            value={view}
            onChange={setView}
            options={VIEW_OPTIONS}
          />
        }
      >
        Browse your <em className="text-emerald">plants</em>
      </PageHeader>

      <main className="flex-1 min-h-0">
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
          <RoomsView cards={spaceCards} totalSpaces={totalSpaces} />
        )}

        {!isLoading && !error && view === 'list' && (
          <div className="flex items-center justify-center min-h-[200px] text-sm text-ink-soft">
            List view ships in TICKET-039b (R3b).
          </div>
        )}
      </main>
    </div>
  )
}

function RoomsView({ cards, totalSpaces }) {
  if (totalSpaces === 0) {
    return (
      <EmptyState
        icon={<span>🏡</span>}
        title="No spaces yet"
        description="Spaces keep your plants grouped by where they live. Add one to get started."
        action={
          <Action to="/welcome" variant="primary">
            Set up spaces
          </Action>
        }
      />
    )
  }

  return (
    <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 list-none p-0">
      <li>
        <AddSpaceTile />
      </li>
      {cards.map(({ space, peek, nextCare }) => (
        <li key={space.id}>
          <RoomCard
            icon={getSpaceEmoji(space.icon)}
            name={space.name}
            count={`${pluralize(space.plants_count, 'plant')} · ${space.category}`}
            variant={space.category === 'outdoor' ? 'outdoor' : 'indoor'}
            peek={peek}
            nextCare={nextCare}
            envHint={envHintFor(space)}
          />
        </li>
      ))}
    </ul>
  )
}

function AddSpaceTile() {
  return (
    <Action
      variant="unstyled"
      onClick={() => {
        // R3a step 3: open AddSpaceDialog (extracted from onboarding's AddCustomSpaceForm).
      }}
      className="w-full h-full min-h-[140px] flex flex-col items-center justify-center gap-1.5 p-4 rounded-md border-2 border-dashed border-emerald/30 hover:border-leaf hover:bg-lime/10 transition-colors"
      aria-label="Add a space"
    >
      <span
        aria-hidden="true"
        className="w-11 h-11 rounded-full bg-mint text-emerald flex items-center justify-center text-[22px] font-bold"
      >
        +
      </span>
      <span className="font-display italic text-[17px] text-emerald leading-none">Add a space</span>
      <span className="text-[11px] font-semibold tracking-[0.04em] text-ink-softer">Indoor or outdoor</span>
    </Action>
  )
}
