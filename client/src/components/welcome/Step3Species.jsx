import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { apiGet } from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { isSearchQuery, useSpeciesSearch } from '../../hooks/useSpecies'
import SearchField from '../form/SearchField'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Badge from '../ui/Badge'
import { CardBody, CardFooter } from '../ui/Card'
import EmptyState from '../ui/EmptyState'

const EMPTY_RESULTS = []

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
  const [roomId, setRoomId] = useState(() => {
    if (initialRoomId) return initialRoomId
    if (availableRooms.length === 1) return availableRooms[0].id
    return null
  })
  const [continuing, setContinuing] = useState(false)
  const toast = useToast()

  // Debounced not deferred — defer delays the render, not the fetch, and Perenual charges per fetch.
  const debouncedQuery = useDebouncedValue(query, 300)
  const { data: fetched = EMPTY_RESULTS, isLoading } = useSpeciesSearch(debouncedQuery)
  // While the user's live input crosses modes (popular ↔ search) ahead of
  // the debounced fetch, hide the stale list so the spinner transitions
  // smoothly instead of flashing the previous mode's results.
  const modeChanging = isSearchQuery(query) !== isSearchQuery(debouncedQuery)
  const results = modeChanging ? EMPTY_RESULTS : fetched
  const searching = isLoading || query !== debouncedQuery
  const shouldReduceMotion = useReducedMotion()

  // Preload result images during idle time so picking one shows the photo
  // immediately. Deferred via requestIdleCallback — firing synchronously with
  // mount had 10 `new Image()` calls stealing frames from the entry animation.
  useEffect(() => {
    if (results.length === 0) return
    const preload = () => {
      for (const result of results) {
        if (result.image_url) {
          const img = new Image()
          img.src = result.image_url
        }
      }
    }
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(preload, { timeout: 2000 })
      return () => window.cancelIdleCallback(handle)
    }
    const handle = setTimeout(preload, 400)
    return () => clearTimeout(handle)
  }, [results])

  function handleSelect(species) {
    setSelected(species)
    setNickname('')
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
  }

  // Perenual-sourced results arrive as SpeciesSearchResult wrappers with
  // id=null. Step 4 needs the full Species#as_json shape (suggested_*,
  // plant_levels) and the plant POST needs a real id, so hydrate via the
  // show endpoint — the controller persists the Perenual row on first call.
  async function handleContinue() {
    if (!selected) return
    setContinuing(true)
    try {
      let species = selected
      if (!species.id && species.perenual_id) {
        const params = new URLSearchParams({
          perenual_id: species.perenual_id,
          common_name: species.common_name ?? '',
          scientific_name: species.scientific_name ?? '',
          image_url: species.image_url ?? '',
        })
        species = await apiGet(`/api/v1/species/${species.perenual_id}?${params}`)
      }
      onComplete(species, nickname, roomId)
    } catch (err) {
      toast.error(err.message || "Couldn't load that species — please pick another")
    } finally {
      setContinuing(false)
    }
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

        {/* Selected state scrolls the whole stack inside the wizard card so the
            title/subtitle don't get pushed off-screen. Search state defers
            scrolling to the listbox inside SearchField. */}
        <div className={`mt-5 flex-1 min-h-0 ${selected ? 'overflow-y-auto -mx-1 px-1' : 'flex flex-col'}`}>
          {/* initial={false} — wizard-level AnimatePresence in Welcome.jsx
              already animates the Step 3 mount; nesting a second entrance
              animation compounded into a visible stutter. */}
          <AnimatePresence mode="wait" initial={false}>
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
                  loading={searching}
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
                <div className="relative rounded-lg text-white overflow-hidden min-h-[140px] bg-[image:var(--gradient-forest)]">
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

                  <div className="absolute inset-0 pointer-events-none hero-image-fade" />

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
          <Action variant="primary" onClick={handleContinue} disabled={!canContinue || continuing} className="flex-1">
            {continuing ? 'Loading species...' : 'Continue'}
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
