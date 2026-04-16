import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'

export function useRooms({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiGet('/api/v1/rooms'),
    enabled,
  })
}

export function useRoomPresets() {
  return useQuery({
    queryKey: ['rooms', 'presets'],
    queryFn: () => apiGet('/api/v1/rooms/presets'),
  })
}

export function useRoom(id) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: () => apiGet(`/api/v1/rooms/${id}`),
    enabled: !!id,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPost('/api/v1/rooms', { room: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => apiPatch(`/api/v1/rooms/${id}`, { room: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/v1/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
