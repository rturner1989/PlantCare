import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { apiGet } from '../../api/client'
import SearchField from '../form/SearchField'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Badge from '../ui/Badge'

// Species search has two modes, selected by query length:
//   - short query (< 2 chars) → hit /api/v1/species with no q, which the
//     backend answers with curated popular picks. This is the empty-state
//     suggestion list.
//   - longer query → pg_search on common/scientific names, with Perenual
//     API fallback for unseeded species.
// Both modes share the same endpoint so TanStack Query caches per key
// transparently — retyping a previous search hits the cache.
function useSpeciesSearch(query) {
  const isSearching = query.length >= 2
  return useQuery({
    queryKey: ['species', isSearching ? ['search', query] : 'popular'],
    queryFn: () => (isSearching ? apiGet(`/api/v1/species?q=${encodeURIComponent(query)}`) : apiGet('/api/v1/species')),
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

export default function Step3Species({ onComplete }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [nickname, setNickname] = useState('')

  // useDeferredValue keeps typing responsive while the downstream fetch
  // catches up — React treats the deferred read as non-urgent. The deferred
  // string feeds into useSpeciesSearch's queryKey so Query caches per term.
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

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-extrabold text-ink mb-2 tracking-tight">Add your first plant</h2>
      <p className="text-sm text-ink-soft mb-6">Search for a species or skip for now.</p>

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
        <div className="mb-4">
          <div className="p-4 rounded-2xl text-white mb-4" style={{ background: 'var(--gradient-forest)' }}>
            <p className="text-lg font-extrabold">{selected.common_name}</p>
            {selected.scientific_name && <p className="text-sm italic opacity-80">{selected.scientific_name}</p>}
            <div className="flex gap-2 mt-2">
              {selected.personality && (
                <span className="text-xs font-bold bg-lime/20 text-lime px-2 py-1 rounded-full">
                  {selected.personality}
                </span>
              )}
              {selected.difficulty && (
                <span className="text-xs font-bold bg-white/20 text-white px-2 py-1 rounded-full">
                  {selected.difficulty}
                </span>
              )}
            </div>
          </div>

          <TextInput
            label="Nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={selected.common_name}
          />

          <Action variant="unstyled" onClick={clearSelection} className="mt-2 text-xs text-ink-soft underline">
            Choose a different species
          </Action>
        </div>
      )}

      <Action
        variant={selected ? 'primary' : 'secondary'}
        onClick={() => onComplete(selected, nickname)}
        className="w-full mt-4"
      >
        {selected ? 'Continue' : 'Skip for now'}
      </Action>
    </div>
  )
}
