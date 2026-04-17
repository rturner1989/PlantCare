import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useDeferredValue, useEffect, useState } from 'react'
import { useSpeciesSearch } from '../../hooks/useSpecies'
import SearchField from '../form/SearchField'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Badge from '../ui/Badge'
import { CardBody, CardFooter } from '../ui/Card'
import EmptyState from '../ui/EmptyState'

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
  // `isLoading`, not `isFetching` — isFetching is also true during
  // background refetches (window focus, network reconnect), which caused
  // the spinner overlay to flash over already-present popular results
  // when the user returned to a suspended tab. isLoading is only true
  // when there is no cached data for the current query key, which is
  // exactly the "we genuinely have nothing to show yet" condition.
  const { data: results = [], isLoading } = useSpeciesSearch(deferredQuery)
  const shouldReduceMotion = useReducedMotion()

  // Preload images of visible results into the browser cache so when the
  // user picks one, the selected-species card shows the photo immediately
  // instead of waiting on a fresh Wikimedia/Perenual fetch.
  useEffect(() => {
    for (const result of results) {
      if (result.image_url) {
        const img = new Image()
        img.src = result.image_url
      }
    }
  }, [results])

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
      <CardBody className={`flex flex-col ${!selected ? 'pb-3' : ''}`}>
        <h1 className="font-display text-3xl font-medium italic text-forest leading-tight tracking-tight">
          Meet your <em className="not-italic text-leaf">first plant</em>.
        </h1>
        <p className="mt-3 text-sm text-ink-soft font-medium leading-snug">
          Or skip — you can add plants anytime from the Add button.
        </p>

        <div className={`mt-5 ${!selected ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
          {/* Search ↔ selected swap now animates both directions. The
              existing fade-in-up CSS keyframe on the selected card only
              covered entrance; going back to the search via "Choose a
              different species" snapped. Framer Motion's AnimatePresence
              gives each branch symmetric enter + exit. */}
          <AnimatePresence mode="wait">
            {!selected ? (
              <motion.div
                key="search"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.33, 1, 0.68, 1] }}
                className="flex-1 min-h-0 flex flex-col"
              >
                <SearchField
                  label="Search species"
                  placeholder="e.g. Monstera, Snake Plant..."
                  query={query}
                  onQueryChange={setQuery}
                  results={results}
                  onSelect={handleSelect}
                  getOptionKey={(species) => species.id ?? species.perenual_id ?? species.common_name}
                  renderOption={(species) => <SpeciesRow species={species} />}
                  renderNoResults={(q) => (
                    <EmptyState
                      description={
                        <>
                          We couldn't find any species matching <span className="font-bold text-ink">"{q}"</span>. Try a
                          different name — common or scientific both work.
                        </>
                      }
                    />
                  )}
                  loading={isLoading}
                  storageKey="species-search"
                  className="flex-1 min-h-0"
                />
              </motion.div>
            ) : (
              <motion.div
                key="selected"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.33, 1, 0.68, 1] }}
              >
                <div
                  className="relative rounded-2xl text-white overflow-hidden min-h-[140px]"
                  style={{ background: 'var(--gradient-forest)' }}
                >
                  {selected.image_url && (
                    <img
                      src={selected.image_url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover scale-[1.15] origin-center"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}

                  {/* Darkened layer the text sits on, fading into the image on the right. */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to right, var(--forest) 0%, rgba(11,58,26,0.9) 45%, rgba(11,58,26,0.4) 70%, rgba(11,58,26,0) 100%)',
                    }}
                  />

                  <div className="relative p-4 pr-[40%]">
                    <p className="text-[9px] font-extrabold text-lime uppercase tracking-wider mb-1">
                      Species selected
                    </p>
                    <p className="text-lg font-extrabold">{selected.common_name}</p>
                    {selected.scientific_name && (
                      <p className="text-xs italic opacity-70">{selected.scientific_name}</p>
                    )}
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
                  </div>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardBody>

      <CardFooter className={`border-t-0 flex flex-col gap-3 ${!selected ? 'pt-3' : ''}`}>
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
