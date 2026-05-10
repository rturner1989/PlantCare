import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DeletePlantDialog from '../../../src/components/plants/DeletePlantDialog'
import { ToastProvider } from '../../../src/context/ToastContext'

const NOW_MS = Date.now()
const RECENT_PLANT = {
  id: 7,
  nickname: 'Monty',
  species: { common_name: 'Monstera' },
  created_at: new Date(NOW_MS - 5 * 24 * 60 * 60 * 1000).toISOString(),
}
const OLD_PLANT = {
  ...RECENT_PLANT,
  created_at: new Date(NOW_MS - 60 * 24 * 60 * 60 * 1000).toISOString(),
}

let deleteCalled = false

function mockFetch(url, init) {
  if (url.includes(`/api/v1/plants/${RECENT_PLANT.id}`) && init?.method === 'DELETE') {
    deleteCalled = true
    return new Response(null, { status: 204 })
  }
  return Response.json({})
}

function renderWithProviders(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <MemoryRouter initialEntries={['/plants/7']}>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <Routes>
            <Route path="/plants/:id" element={ui} />
            <Route path="/house" element={<p>House page</p>} />
          </Routes>
        </ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('DeletePlantDialog', () => {
  beforeEach(() => {
    deleteCalled = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => mockFetch(String(url), init)),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders Delete enabled for plants younger than 30 days', () => {
    renderWithProviders(<DeletePlantDialog plant={RECENT_PLANT} open onClose={() => {}} />)
    const deleteButton = screen.getByRole('button', { name: /^Delete$/ })
    expect(deleteButton).not.toBeDisabled()
    expect(screen.queryByLabelText(/Type the plant's name/)).toBeNull()
  })

  it('disables Delete until the typed name matches for plants older than 30 days', () => {
    renderWithProviders(<DeletePlantDialog plant={OLD_PLANT} open onClose={() => {}} />)
    const deleteButton = screen.getByRole('button', { name: /^Delete$/ })
    expect(deleteButton).toBeDisabled()

    const input = screen.getByLabelText(/Type the plant's name/)
    fireEvent.change(input, { target: { value: 'wrong' } })
    expect(deleteButton).toBeDisabled()

    fireEvent.change(input, { target: { value: 'Monty' } })
    expect(deleteButton).not.toBeDisabled()
  })

  it('fires DELETE, navigates to /house, and calls onClose on success', async () => {
    const onClose = vi.fn()
    renderWithProviders(<DeletePlantDialog plant={RECENT_PLANT} open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /^Delete$/ }))

    await waitFor(() => expect(deleteCalled).toBe(true))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByText('House page')).toBeInTheDocument())
  })
})
