import { useMemo, useState } from 'react'
import { formatSpaceName } from '../../utils/spaceIcons'
import Row from '../plants/Row'
import Action from '../ui/Action'
import Card from '../ui/Card'
import EmptyState from '../ui/EmptyState'
import Accordion from './list/Accordion'
import AddSpaceRow from './list/AddSpaceRow'
import SearchBar from './list/SearchBar'

export default function ListView({
  spaces,
  plants,
  weatherToday,
  filteredSpaceId,
  onClearFilter,
  searchQuery,
  onSearchChange,
  onAddSpace,
}) {
  const [openSpaceId, setOpenSpaceId] = useState(() => {
    const firstNonEmpty = spaces.find((space) => plants.some((plant) => plant.space?.id === space.id))
    return firstNonEmpty?.id ?? spaces[0]?.id ?? null
  })

  const filtered = useMemo(() => {
    let result = plants
    if (filteredSpaceId) {
      result = result.filter((plant) => plant.space?.id === filteredSpaceId)
    }
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (plant) =>
          plant.nickname?.toLowerCase().includes(query) || plant.species?.common_name?.toLowerCase().includes(query),
      )
    }
    return result
  }, [plants, filteredSpaceId, searchQuery])

  const filteredSpace = filteredSpaceId ? spaces.find((space) => space.id === filteredSpaceId) : null
  const hasActiveFilter = Boolean(filteredSpaceId) || searchQuery.trim().length > 0

  const groups = useMemo(
    () =>
      spaces
        .map((space) => ({
          space,
          plants: filtered.filter((plant) => plant.space?.id === space.id),
        }))
        .filter((group) => !hasActiveFilter || group.plants.length > 0),
    [spaces, filtered, hasActiveFilter],
  )

  function toggleSpace(spaceId) {
    setOpenSpaceId((current) => (current === spaceId ? null : spaceId))
  }

  if (plants.length === 0) {
    return (
      <EmptyState
        icon={<span>🌱</span>}
        title="No plants yet"
        description="Add your first plant to start tracking its care."
        action={
          <Action to="/add-plant" variant="primary">
            Add a plant
          </Action>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClearAll={() => {
          onSearchChange('')
          onClearFilter()
        }}
        hasFilterToClear={Boolean(filteredSpace)}
        placeholder={filteredSpace ? `Search ${formatSpaceName(filteredSpace.name)}…` : 'Search plants…'}
      />

      <Card variant="paper-warm" className="overflow-hidden">
        <Card.Header
          divider={false}
          className="grid grid-cols-[40px_1fr_140px_24px] sm:grid-cols-[40px_1fr_160px_24px] items-center gap-3.5 px-4 sm:px-[18px] py-2.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink-softer border-b border-paper-edge"
        >
          <span aria-hidden="true" />
          <span>Plant</span>
          <span>Next care</span>
          <span className="text-right">Mood</span>
        </Card.Header>
        <Card.Body className="!overflow-visible !flex-none">
          <AddSpaceRow onClick={onAddSpace} />
          {filtered.length === 0 ? (
            <p className="px-[18px] py-10 text-center text-sm text-ink-soft">
              No plants match {searchQuery ? `“${searchQuery}”` : 'these filters'}.
            </p>
          ) : (
            groups.map(({ space, plants: spacePlants }) => {
              const isOpen = hasActiveFilter || openSpaceId === space.id
              return (
                <Accordion
                  key={space.id}
                  space={space}
                  weatherToday={weatherToday}
                  isOpen={isOpen}
                  onToggle={() => toggleSpace(space.id)}
                >
                  {spacePlants.length === 0 ? (
                    <EmptyState
                      icon={<span>🌱</span>}
                      description={`No plants in ${formatSpaceName(space.name)} yet.`}
                      action={
                        <Action to="/add-plant" variant="secondary">
                          Add one
                        </Action>
                      }
                      className="py-6"
                    />
                  ) : (
                    spacePlants.map((plant) => <Row key={plant.id} plant={plant} />)
                  )}
                </Accordion>
              )
            })
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
