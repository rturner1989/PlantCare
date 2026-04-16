import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { apiGet } from '../../api/client'
import SearchField from '../form/SearchField'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Badge from '../ui/Badge'
import { CardBody, CardFooter } from '../ui/Card'

// keepPreviousData keeps the current results visible while the next
// query is in flight; without it the dropdown flashes empty on every
// keystroke as the queryKey changes.
function useSpeciesSearch(query) {
  const isSearching = query.length >= 2
  return useQuery({
    queryKey: ['species', isSearching ? ['search', query] : 'popular'],
    queryFn: () => (isSearching ? apiGet(`/api/v1/species?q=${encodeURIComponent(query)}`) : apiGet('/api/v1/species')),
    placeholderData: keepPreviousData,
  })
}

function SpeciesRow({ species }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-bold text-ink">{species.common_name}</p>
        {species.scientific_name && <p className="text-xs text-ink-soft italic">{species.scientific_name}</p>}
      </div>
      {species.personality && (
        <Badge scheme="emerald" variant="soft">
          {species.personality}
        </Badge>
      )}
    </div>
  )
}

export default function Step3Species({
  availableRooms = [],
  initialSpecies = null,
  initialNickname = '',
  initialRoomId = null,
  onBack,
  onComplete,
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(initialSpecies)
  const [nickname, setNickname] = useState(initialNickname)
  // Auto-pick the single-room case so we don't render a picker with one
  // option. Multi-room stays null so Continue blocks on an explicit choice.
  const [roomId, setRoomId] = useState(() => {
    if (initialRoomId) return initialRoomId
    if (availableRooms.length === 1) return availableRooms[0].id
    return null
  })

  const deferredQuery = useDeferredValue(query)
  const { data: results = [] } = useSpeciesSearch(deferredQuery)

  function handleSelect(species) {
    setSelected(species)
    setNickname('')
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
  }

  const needsRoomChoice = availableRooms.length > 1
  const canContinue = selected && (!!roomId || availableRooms.length === 0)

  return (
    <>
      <CardBody>
        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
          Meet your <em className="not-italic text-leaf">first plant</em>.
        </h1>
        <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
          Or skip — you can add plants anytime from the Add button.
        </p>

        <div className="mt-5">
          {!selected && (
            <SearchField
              label="Search species"
              placeholder="e.g. Monstera, Snake Plant..."
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={handleSelect}
              getOptionKey={(species) => species.id ?? species.common_name}
              renderOption={(species) => <SpeciesRow species={species} />}
            />
          )}

          {selected && (
            <div>
              <div
                className="relative p-4 pr-[104px] rounded-2xl text-white overflow-hidden"
                style={{ background: 'var(--gradient-forest)' }}
              >
                <p className="text-[9px] font-extrabold text-lime uppercase tracking-wider mb-1">Species selected</p>
                <p className="text-lg font-extrabold">{selected.common_name}</p>
                {selected.scientific_name && <p className="text-xs italic opacity-70">{selected.scientific_name}</p>}
                <div className="flex gap-2 mt-3">
                  {selected.personality && (
                    <span className="text-[10px] font-bold bg-white/10 text-lime px-2.5 py-1 rounded-full">
                      {selected.personality}
                    </span>
                  )}
                  {selected.difficulty && (
                    <span className="text-[10px] font-bold bg-white/10 text-lime px-2.5 py-1 rounded-full">
                      {selected.difficulty}
                    </span>
                  )}
                </div>
                {selected.image_url && (
                  <img
                    src={selected.image_url}
                    alt=""
                    className="absolute top-2 right-2 w-20 h-20 rounded-xl object-cover border-2 border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>

              {needsRoomChoice && (
                <label className="block mt-4">
                  <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Which room?</span>
                  <select
                    value={roomId ?? ''}
                    onChange={(e) => setRoomId(Number(e.target.value))}
                    className="mt-1 w-full px-4 py-3 rounded-md bg-mint/50 border border-mint text-ink text-base font-semibold focus:outline-none focus:ring-4 focus:ring-leaf/20 focus:border-leaf"
                  >
                    <option value="" disabled>
                      Pick a room...
                    </option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="mt-4">
                <TextInput
                  label="What should we call them?"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={selected.common_name}
                  hint={
                    nickname
                      ? `Nice choice. I already like ${nickname}.`
                      : `Leave blank and we'll call them ${selected.common_name}.`
                  }
                />
              </div>

              <Action variant="unstyled" onClick={clearSelection} className="mt-3 text-xs text-ink-soft underline">
                Choose a different species
              </Action>
            </div>
          )}
        </div>
      </CardBody>

      <CardFooter className="border-t-0 flex flex-col gap-3">
        <div className="flex gap-2.5">
          <Action variant="secondary" onClick={onBack}>
            Back
          </Action>
          <Action
            variant="primary"
            onClick={() => onComplete(selected, nickname, roomId)}
            disabled={!canContinue}
            className="flex-1"
          >
            Continue
          </Action>
        </div>

        <p className="text-center text-xs text-ink-soft font-bold">
          Prefer to do this later?{' '}
          <Action variant="unstyled" onClick={() => onComplete(null, '', null)} className="text-emerald">
            Skip for now
          </Action>
        </p>
      </CardFooter>
    </>
  )
}
