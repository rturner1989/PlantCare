import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiGet } from '../api/client'

export function useSpeciesSearch(query) {
  const isSearching = query.length >= 2
  return useQuery({
    queryKey: ['species', isSearching ? ['search', query] : 'popular'],
    queryFn: () => (isSearching ? apiGet(`/api/v1/species?q=${encodeURIComponent(query)}`) : apiGet('/api/v1/species')),
    placeholderData: keepPreviousData,
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
