import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPatch } from '../api/client'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGet('/api/v1/profile'),
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => apiPatch('/api/v1/profile', { user: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, password, passwordConfirmation }) =>
      apiPatch('/api/v1/profile/password', {
        current_password: currentPassword,
        user: { password, password_confirmation: passwordConfirmation },
      }),
  })
}
