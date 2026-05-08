import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SpeciesPicker from '../../../src/components/plants/SpeciesPicker'

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('SpeciesPicker', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json([
          { id: 1, common_name: 'Snake Plant', scientific_name: 'Dracaena trifasciata' },
          { id: 2, common_name: 'Monstera', scientific_name: 'Monstera deliciosa' },
        ]),
      ),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the search input', () => {
    render(<SpeciesPicker onPick={vi.fn()} />, { wrapper: makeWrapper() })
    expect(screen.getByPlaceholderText('Search species…')).toBeInTheDocument()
  })

  it('renders popular species tiles after the popular query resolves', async () => {
    render(<SpeciesPicker onPick={vi.fn()} />, { wrapper: makeWrapper() })
    expect(await screen.findByRole('button', { name: /Snake Plant/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Monstera/ })).toBeInTheDocument()
  })

  it('fires onPick when a species tile is clicked', async () => {
    const onPick = vi.fn()
    render(<SpeciesPicker onPick={onPick} />, { wrapper: makeWrapper() })
    const snakePlant = await screen.findByRole('button', { name: /Snake Plant/ })
    fireEvent.click(snakePlant)
    expect(onPick).toHaveBeenCalledOnce()
    expect(onPick.mock.calls[0][0]).toMatchObject({ common_name: 'Snake Plant' })
  })

  it('honours actionLabel — "tap to pick" vs "tap to add"', async () => {
    const { unmount } = render(<SpeciesPicker onPick={vi.fn()} actionLabel="pick" />, { wrapper: makeWrapper() })
    await waitFor(() => expect(screen.getByText(/Popular · tap to pick/)).toBeInTheDocument())
    unmount()
    render(<SpeciesPicker onPick={vi.fn()} actionLabel="add" />, { wrapper: makeWrapper() })
    await waitFor(() => expect(screen.getByText(/Popular · tap to add/)).toBeInTheDocument())
  })

  it('autoFocus places focus on the search input on mount', () => {
    render(<SpeciesPicker onPick={vi.fn()} autoFocus />, { wrapper: makeWrapper() })
    expect(document.activeElement).toBe(screen.getByPlaceholderText('Search species…'))
  })
})
