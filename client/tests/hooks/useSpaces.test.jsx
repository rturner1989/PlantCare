import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiDelete, apiGet, apiPost } from '../../src/api/client'
import { useCreateSpace, useDeleteSpace, useSpacePresets, useSpaces } from '../../src/hooks/useSpaces'

// vi.mock is hoisted above the import, so `apiGet` etc. resolve to these
// mocks when the hook module imports them.
vi.mock('../../src/api/client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}))

// Fresh QueryClient per test so cache state doesn't leak across cases.
// retry: false so failed queries surface immediately instead of burning
// 10s on the default 3-retry backoff.
function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSpaces hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSpaces()', () => {
    it('fetches /api/v1/spaces by default', async () => {
      apiGet.mockResolvedValue([{ id: 1, name: 'Kitchen' }])
      const { result } = renderHook(() => useSpaces(), { wrapper: makeWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(apiGet).toHaveBeenCalledWith('/api/v1/spaces')
      expect(result.current.data).toEqual([{ id: 1, name: 'Kitchen' }])
    })

    it('skips the fetch when enabled is false', async () => {
      const { result } = renderHook(() => useSpaces({ enabled: false }), { wrapper: makeWrapper() })

      // With enabled:false, TanStack keeps the observer idle — fetchStatus
      // stays 'idle' and the queryFn never runs.
      expect(result.current.fetchStatus).toBe('idle')
      expect(apiGet).not.toHaveBeenCalled()
    })
  })

  describe('useSpacePresets()', () => {
    it('fetches /api/v1/spaces/presets', async () => {
      apiGet.mockResolvedValue([{ name: 'Kitchen', icon: 'kitchen' }])
      const { result } = renderHook(() => useSpacePresets(), { wrapper: makeWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(apiGet).toHaveBeenCalledWith('/api/v1/spaces/presets')
    })
  })

  // These lock the cache-key contract between the list query and the
  // mutations. If someone renames useSpaces' queryKey but forgets to update
  // invalidateQueries, these fail — otherwise the drift is silent.
  describe('cache invalidation contract', () => {
    it('useCreateSpace refreshes useSpaces after a successful create', async () => {
      apiGet.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 1, name: 'New Space' }])
      apiPost.mockResolvedValue({ id: 1, name: 'New Space' })

      const { result } = renderHook(() => ({ spaces: useSpaces(), create: useCreateSpace() }), {
        wrapper: makeWrapper(),
      })

      await waitFor(() => expect(result.current.spaces.data).toEqual([]))

      await act(async () => {
        await result.current.create.mutateAsync({ name: 'New Space', icon: null })
      })

      expect(apiPost).toHaveBeenCalledWith('/api/v1/spaces', { space: { name: 'New Space', icon: null } })
      await waitFor(() => expect(result.current.spaces.data).toEqual([{ id: 1, name: 'New Space' }]))
    })

    it('useDeleteSpace refreshes useSpaces after a successful delete', async () => {
      apiGet.mockResolvedValueOnce([{ id: 1, name: 'Kitchen' }]).mockResolvedValueOnce([])
      apiDelete.mockResolvedValue(null)

      const { result } = renderHook(() => ({ spaces: useSpaces(), deleteSpace: useDeleteSpace() }), {
        wrapper: makeWrapper(),
      })

      await waitFor(() => expect(result.current.spaces.data).toEqual([{ id: 1, name: 'Kitchen' }]))

      await act(async () => {
        await result.current.deleteSpace.mutateAsync(1)
      })

      expect(apiDelete).toHaveBeenCalledWith('/api/v1/spaces/1')
      await waitFor(() => expect(result.current.spaces.data).toEqual([]))
    })
  })
})
