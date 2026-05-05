import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet } from '../../src/api/client'
import { useWeather } from '../../src/hooks/useWeather'

vi.mock('../../src/api/client', () => ({
  apiGet: vi.fn(),
}))

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches /api/v1/weather and exposes today + week + locationLabel', async () => {
    apiGet.mockResolvedValue({
      today: { scheme: 'heat', icon: '☀', label: 'Clear', detail: '22° · clear', temperature: 22 },
      week: [
        { date: '2026-05-02', scheme: 'heat', icon: '☀', label: 'Clear', temperature: 22 },
        { date: '2026-05-03', scheme: 'sky', icon: '☁', label: 'Cloudy', temperature: 18 },
      ],
      location_label: 'Greenwich (default)',
    })

    const { result } = renderHook(() => useWeather(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(apiGet).toHaveBeenCalledWith('/api/v1/weather')
    expect(result.current.today.label).toBe('Clear')
    expect(result.current.week).toHaveLength(2)
    expect(result.current.locationLabel).toBe('Greenwich (default)')
  })

  it('returns null today + empty week before resolution', () => {
    apiGet.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useWeather(), { wrapper: makeWrapper() })
    expect(result.current.today).toBeNull()
    expect(result.current.week).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })
})
