import { useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { isSearchQuery, useSpeciesSearch } from '../../hooks/useSpecies'
import TextInput from '../form/TextInput'
import Tile from '../form/Tile'
import EmptyState from '../ui/EmptyState'
import Spinner from '../ui/Spinner'

const EMPTY_RESULTS = []

function speciesKey(species) {
  return species.id ?? species.perenual_id ?? species.common_name
}

export default function SpeciesPicker({ onPick, actionLabel = 'pick', autoFocus = false }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 300)
  const isSearching = isSearchQuery(debouncedQuery)
  const { data: results = EMPTY_RESULTS, isLoading } = useSpeciesSearch(debouncedQuery)

  const modeChanging = isSearchQuery(query) !== isSearching
  const visibleResults = modeChanging ? EMPTY_RESULTS : results
  const loading = isLoading || query !== debouncedQuery

  return (
    <div className="flex flex-col gap-4">
      <TextInput
        label="Search species"
        labelHidden
        type="search"
        placeholder="Search species…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus={autoFocus}
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
                Nothing matches <span className="font-bold text-ink">"{debouncedQuery}"</span>. Try a different name.
              </>
            }
          />
        ) : (
          <div className="text-left">
            <p className="text-[10px] font-extrabold tracking-[0.14em] uppercase text-ink-soft mb-2.5">
              {isSearching ? `Results · tap to ${actionLabel}` : `Popular · tap to ${actionLabel}`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {visibleResults.map((species) => (
                <Tile key={speciesKey(species)} size="card" onClick={() => onPick(species)}>
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
    </div>
  )
}
