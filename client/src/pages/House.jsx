import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SegmentedControl from '../components/form/SegmentedControl'
import TextInput from '../components/form/TextInput'
import PlantAvatar from '../components/PlantAvatar'
import RoomCard from '../components/RoomCard'
import Action from '../components/ui/Action'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { usePlants } from '../hooks/usePlants'
import { useRooms } from '../hooks/useRooms'
import { pluralize } from '../utils/pluralize'

const VIEW_OPTIONS = [
  { value: 'rooms', label: 'Rooms' },
  { value: 'list', label: 'List' },
  { value: 'greenhouse', label: 'Greenhouse', disabled: true, hint: 'Coming in Phase 3' },
]

function needsCare(plant) {
  return plant.water_status === 'overdue' || plant.feed_status === 'overdue'
}

function isWaterDue(plant) {
  return plant.water_status === 'overdue' || plant.water_status === 'due_today'
}

function isFeedDue(plant) {
  return plant.feed_status === 'overdue' || plant.feed_status === 'due_today'
}

export default function House() {
  const [viewMode, setViewMode] = useState('rooms')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRoomId, setFilteredRoomId] = useState(null)
  const { data: rooms, isLoading: roomsLoading, error: roomsError, refetch: refetchRooms } = useRooms()
  const { data: plants, isLoading: plantsLoading, error: plantsError, refetch: refetchPlants } = usePlants()
  const navigate = useNavigate()

  const isLoading = roomsLoading || plantsLoading
  const error = roomsError || plantsError

  const roomAttention = useMemo(() => {
    if (!plants) return {}
    const counts = {}
    for (const plant of plants) {
      if (needsCare(plant)) {
        const roomId = plant.room?.id
        if (roomId != null) counts[roomId] = (counts[roomId] || 0) + 1
      }
    }
    return counts
  }, [plants])

  const filteredRoom = useMemo(() => {
    if (!filteredRoomId || !rooms) return null
    return rooms.find((room) => room.id === filteredRoomId) ?? null
  }, [filteredRoomId, rooms])

  const filteredPlants = useMemo(() => {
    if (!plants) return []
    const query = searchQuery.trim().toLowerCase()

    return plants.filter((plant) => {
      if (filteredRoomId && plant.room?.id !== filteredRoomId) return false
      if (!query) return true

      return plant.nickname?.toLowerCase().includes(query) || plant.species?.common_name?.toLowerCase().includes(query)
    })
  }, [plants, searchQuery, filteredRoomId])

  const totalPlants = plants?.length ?? 0
  const totalRooms = rooms?.length ?? 0
  const overdueCount = Object.values(roomAttention).reduce((sum, n) => sum + n, 0)

  function handleRoomTap(roomId) {
    setFilteredRoomId(roomId)
    setSearchQuery('')
    setViewMode('list')
  }

  function clearRoomFilter() {
    setFilteredRoomId(null)
  }

  function handleViewChange(nextMode) {
    setViewMode(nextMode)
    if (nextMode === 'rooms') {
      setFilteredRoomId(null)
      setSearchQuery('')
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3 lg:gap-4 px-3 lg:px-4 lg:pt-4 lg:pb-4">
      <header className="bg-card rounded-md shadow-[var(--shadow-sm)] p-4">
        <p className="text-[13px] font-semibold text-ink-soft">Your collection</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink lg:font-display lg:text-5xl lg:italic lg:font-medium">
          House
        </h1>
        {totalRooms > 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            {pluralize(totalRooms, 'room')}, {pluralize(totalPlants, 'plant')}
            {overdueCount > 0 && (
              <>
                {' · '}
                <span className="font-bold text-coral-deep">{overdueCount} need attention</span>
              </>
            )}
          </p>
        )}
        <SegmentedControl
          label="View as"
          value={viewMode}
          onChange={handleViewChange}
          options={VIEW_OPTIONS}
          className="mb-0"
        />
      </header>

      <div className="relative flex flex-col flex-1 min-h-0 bg-card rounded-md shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              aria-label="Loading your house"
              className="flex-1 flex items-center justify-center"
            >
              <Spinner />
            </div>
          )}

          {!isLoading && error && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="We couldn't load your house"
                description="Something went wrong fetching your rooms and plants."
                action={
                  <Action
                    variant="secondary"
                    onClick={() => {
                      refetchRooms()
                      refetchPlants()
                    }}
                  >
                    Try again
                  </Action>
                }
              />
            </div>
          )}

          {!isLoading && !error && viewMode === 'rooms' && (
            <RoomsView rooms={rooms} roomAttention={roomAttention} onRoomTap={handleRoomTap} />
          )}

          {!isLoading && !error && viewMode === 'list' && (
            <ListView
              plants={filteredPlants}
              totalPlants={totalPlants}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredRoom={filteredRoom}
              onClearRoomFilter={clearRoomFilter}
              onPlantTap={(plantId) => navigate(`/plants/${plantId}`)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RoomsView({ rooms, roomAttention, onRoomTap }) {
  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<span>🏡</span>}
          title="No rooms yet"
          description="Rooms keep your plants grouped by where they live. Add one to get started."
          action={
            <Action to="/welcome" variant="primary">
              Set up rooms
            </Action>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          attentionCount={roomAttention[room.id] || 0}
          onClick={() => onRoomTap(room.id)}
        />
      ))}
    </div>
  )
}

function ListView({ plants, totalPlants, searchQuery, onSearchChange, filteredRoom, onClearRoomFilter, onPlantTap }) {
  if (totalPlants === 0 && !filteredRoom) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<span>🌱</span>}
          title="Your jungle starts here"
          description="Add a plant to see it come alive."
          action={
            <Action to="/add-plant" variant="primary">
              Add a plant
            </Action>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredRoom && (
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
          <span>Filtered by</span>
          <Action
            variant="unstyled"
            onClick={onClearRoomFilter}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint text-emerald normal-case tracking-normal text-[12px]"
            aria-label={`Clear ${filteredRoom.name} filter`}
          >
            {filteredRoom.name}
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </Action>
        </div>
      )}

      <TextInput
        label="Search plants"
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or species"
      />

      {plants.length === 0 ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <EmptyState
            title="Nothing matches"
            description={searchQuery ? `No plants match "${searchQuery}".` : 'This room has no plants yet.'}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {plants.map((plant) => (
            <li key={plant.id}>
              <PlantTile plant={plant} onTap={() => onPlantTap(plant.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PlantTile({ plant, onTap }) {
  const waterDue = isWaterDue(plant)
  const feedDue = isFeedDue(plant)

  return (
    <Action
      variant="unstyled"
      onClick={onTap}
      className="w-full flex items-center gap-3 p-3 rounded-md bg-card border border-mint text-left transition-colors hover:border-leaf/50"
    >
      <PlantAvatar species={plant.species} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-extrabold text-ink truncate">{plant.nickname}</p>
        <p className="text-[13px] text-ink-soft truncate">
          {plant.species?.common_name ?? 'Unknown species'}
          {plant.room?.name && ` · ${plant.room.name}`}
        </p>
      </div>
      {(waterDue || feedDue) && (
        <span role="img" aria-label="Needs care" className="flex items-center gap-1 shrink-0">
          {waterDue && <span aria-hidden="true">💧</span>}
          {feedDue && <span aria-hidden="true">🌱</span>}
        </span>
      )}
    </Action>
  )
}
