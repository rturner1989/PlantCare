import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPatch } from '../../src/api/client'
import { useUnseenAchievements } from '../../src/hooks/useUnseenAchievements'

vi.mock('../../src/api/client', () => ({
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
}))

const authState = { user: { id: 1, email: 'rob@test.com' } }
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useUnseenAchievements()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches /api/v1/achievements/unseen and exposes the queue', async () => {
    apiGet.mockResolvedValue({
      achievements: [{ id: 7, kind: 'login_streak_7', label: '7-day visit streak', emoji: '⭐' }],
    })

    const { result } = renderHook(() => useUnseenAchievements(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(apiGet).toHaveBeenCalledWith('/api/v1/achievements/unseen')
    expect(result.current.achievements).toHaveLength(1)
    expect(result.current.achievements[0].kind).toBe('login_streak_7')
  })

  it('returns an empty queue when the endpoint returns no entries', async () => {
    apiGet.mockResolvedValue({ achievements: [] })

    const { result } = renderHook(() => useUnseenAchievements(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.achievements).toEqual([])
  })

  it('skips the fetch when no user is authenticated', async () => {
    authState.user = null
    try {
      renderHook(() => useUnseenAchievements(), { wrapper: makeWrapper() })
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(apiGet).not.toHaveBeenCalled()
    } finally {
      authState.user = { id: 1, email: 'rob@test.com' }
    }
  })

  it('markSeen PATCHes /api/v1/achievements/:id with empty body', async () => {
    apiGet.mockResolvedValue({ achievements: [{ id: 7, kind: 'login_streak_7' }] })
    apiPatch.mockResolvedValue({ achievement: { id: 7, seen_at: '2026-05-03T15:00:00Z' } })

    const { result } = renderHook(() => useUnseenAchievements(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    result.current.markSeen(7)

    await waitFor(() => expect(apiPatch).toHaveBeenCalled())
    expect(apiPatch).toHaveBeenCalledWith('/api/v1/achievements/7', {})
  })
})
