import { faPenToSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo } from 'react'
import { pluralize } from '../../utils/pluralize'
import { formatSpaceName, getSpaceEmoji } from '../../utils/spaceIcons'
import Action from '../ui/Action'
import EmptyState from '../ui/EmptyState'
import Tooltip from '../ui/Tooltip'
import AddSpaceTile from './rooms/AddSpaceTile'
import RoomCard from './rooms/RoomCard'

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

function weatherPillFor(today) {
  if (!today) return null
  return {
    icon: today.icon ?? '☀',
    label: today.detail ?? today.label,
    scheme: today.scheme,
  }
}

export default function RoomsView({ spaces, plants, weatherToday, onAddSpace, onEditSpace, onSelectSpace }) {
  const cards = useMemo(() => {
    if (!spaces || !plants) return []
    return spaces.map((space) => {
      const spacePlants = plants.filter((plant) => plant.space?.id === space.id)
      return {
        space,
        peek: peekFor(spacePlants),
        nextCare: nextCareFor(spacePlants),
      }
    })
  }, [spaces, plants])

  if (spaces.length === 0) {
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
        <AddSpaceTile onClick={onAddSpace} />
      </li>
      {cards.map(({ space, peek, nextCare }) => {
        const isOutdoor = space.category === 'outdoor'
        const displayName = formatSpaceName(space.name)
        return (
          <li key={space.id} className="relative">
            <RoomCard
              icon={getSpaceEmoji(space.icon)}
              name={displayName}
              count={`${pluralize(space.plants_count, 'plant')} · ${space.category}`}
              variant={isOutdoor ? 'outdoor' : 'indoor'}
              peek={peek}
              nextCare={nextCare}
              envHint={envHintFor(space)}
              weatherPill={isOutdoor ? weatherPillFor(weatherToday) : null}
              onClick={() => onSelectSpace(space)}
            />
            <Action
              variant="unstyled"
              onClick={() => onEditSpace(space)}
              aria-label={`Edit ${displayName}`}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-ink/[0.04] text-ink-soft hover:bg-ink/[0.08] hover:text-ink transition-colors flex items-center justify-center cursor-pointer group"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="w-3 h-3" />
              <Tooltip placement="left">Edit</Tooltip>
            </Action>
          </li>
        )
      })}
    </ul>
  )
}
