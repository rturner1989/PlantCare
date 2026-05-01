import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch, apiPost } from '../../src/api/client'
import { useMarkNotificationRead, useNotifications, useNotificationsSeen } from '../../src/hooks/useNotifications'

vi.mock('../../src/api/client', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useNotifications hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useNotifications()', () => {
    it('fetches /api/v1/notifications and exposes the parsed payload', async () => {
      apiGet.mockResolvedValue({
        unread_count: 3,
        notifications: [{ id: 1, kind: 'milestone', title: '30 days with Wilty' }],
      })
      const { result } = renderHook(() => useNotifications(), { wrapper: makeWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(apiGet).toHaveBeenCalledWith('/api/v1/notifications')
      expect(result.current.data.unread_count).toBe(3)
      expect(result.current.data.notifications).toHaveLength(1)
    })
  })

  describe('useMarkNotificationRead()', () => {
    it('PATCHes /api/v1/notifications/:id and invalidates the notifications query', async () => {
      apiPatch.mockResolvedValue({ unread_count: 2, notification: { id: 7, read_at: '2026-05-01T00:00:00Z' } })
      const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: makeWrapper() })

      result.current.mutate(7)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(apiPatch).toHaveBeenCalledWith('/api/v1/notifications/7', {})
    })
  })

  describe('useNotificationsSeen()', () => {
    it('POSTs /api/v1/notifications_seen and invalidates the cache', async () => {
      apiPost.mockResolvedValue({ unread_count: 5 })
      const { result } = renderHook(() => useNotificationsSeen(), { wrapper: makeWrapper() })

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(apiPost).toHaveBeenCalledWith('/api/v1/notifications_seen', {})
    })
  })
})
