import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'
import { apiGet } from '../../api/client'
import SearchField from '../form/SearchField'
import TextInput from '../form/TextInput'
import Action from '../ui/Action'
import Badge from '../ui/Badge'

// Species search has two modes, selected by query length:
//   - short query (< 2 chars) → /api/v1/species with no q, answered by the
//     backend with curated popular picks (the empty-state suggestions).
//   - longer query → pg_search + Perenual fallback.
// Both share the endpoint so TanStack Query caches per key transparently.
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

export default function Step3Species({ onBack, onComplete }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [nickname, setNickname] = useState('')

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
    <div className="flex flex-col flex-1">
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
            <div className="p-4 rounded-2xl text-white" style={{ background: 'var(--gradient-forest)' }}>
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
            </div>

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

      <div className="mt-auto pt-6 flex gap-2.5">
        <Action variant="secondary" onClick={onBack}>
          Back
        </Action>
        <Action
          variant="primary"
          onClick={() => onComplete(selected, nickname)}
          disabled={!selected}
          className="flex-1"
        >
          Continue
        </Action>
      </div>

      <p className="mt-3 text-center text-xs text-ink-soft font-bold">
        Prefer to do this later?{' '}
        <Action variant="unstyled" onClick={() => onComplete(null, '')} className="text-emerald">
          Skip for now
        </Action>
      </p>
    </div>
  )
}
