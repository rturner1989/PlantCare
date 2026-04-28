import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'

export function useSpaces({ enabled = true, scope = 'active' } = {}) {
  const queryParam = scope === 'active' ? '' : `?scope=${scope}`
  return useQuery({
    queryKey: ['spaces', scope],
    queryFn: () => apiGet(`/api/v1/spaces${queryParam}`),
    enabled,
  })
}

export function useArchiveSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiPost(`/api/v1/spaces/${id}/archive`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

export function useUnarchiveSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/v1/spaces/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

export function useSpacePresets() {
  return useQuery({
    queryKey: ['spaces', 'presets'],
    queryFn: () => apiGet('/api/v1/spaces/presets'),
  })
}

export function useSpace(id) {
  return useQuery({
    queryKey: ['spaces', id],
    queryFn: () => apiGet(`/api/v1/spaces/${id}`),
    enabled: !!id,
  })
}

export function useCreateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPost('/api/v1/spaces', { space: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

export function useUpdateSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => apiPatch(`/api/v1/spaces/${id}`, { space: data }),
    onSuccess: (updatedSpace) => {
      // Patch every cached spaces list (active / archived / all) with the
      // updated record so subsequent reads — including Step 4 remount on
      // Back nav — see the new env immediately, without waiting for a
      // refetch round-trip. Plants reschedule on the server, so their
      // cache also needs invalidating.
      queryClient.setQueriesData({ queryKey: ['spaces'] }, (existing) => {
        if (!Array.isArray(existing)) return existing
        return existing.map((space) => (space.id === updatedSpace.id ? updatedSpace : space))
      })
      queryClient.invalidateQueries({ queryKey: ['plants'] })
    },
  })
}

export function useDeleteSpace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/v1/spaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}
