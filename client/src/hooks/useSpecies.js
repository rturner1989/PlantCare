import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/client'

export function useSpeciesSearch(query) {
  const isSearching = query.length >= 2
  return useQuery({
    queryKey: ['species', isSearching ? ['search', query] : 'popular'],
    queryFn: () => (isSearching ? apiGet(`/api/v1/species?q=${encodeURIComponent(query)}`) : apiGet('/api/v1/species')),
    // Reuse previous results only within the same mode — showing the
    // popular list while a search fetch is in flight (or vice-versa)
    // flashes unrelated data onto the screen mid-transition.
    placeholderData: (previousData, previousQuery) => {
      const previousKey = previousQuery?.queryKey?.[1]
      const previousWasSearching = Array.isArray(previousKey) && previousKey[0] === 'search'
      return previousWasSearching === isSearching ? previousData : undefined
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useSpecies(id) {
  return useQuery({
    queryKey: ['species', id],
    queryFn: () => apiGet(`/api/v1/species/${id}`),
    enabled: !!id,
  })
}
