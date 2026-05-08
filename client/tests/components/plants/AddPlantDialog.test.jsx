import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AddPlantDialog from '../../../src/components/plants/AddPlantDialog'
import { AddPlantProvider } from '../../../src/context/AddPlantContext'
import { ToastProvider } from '../../../src/context/ToastContext'
import { useAddPlant } from '../../../src/hooks/useAddPlant'

const SPECIES = [
  { id: 1, common_name: 'Snake Plant', scientific_name: 'Dracaena trifasciata' },
  { id: 2, common_name: 'Monstera', scientific_name: 'Monstera deliciosa' },
]

const SPACES = [
  { id: 10, name: 'Living Room', icon: 'couch', category: 'indoor', archived_at: null },
  { id: 11, name: 'Bedroom', icon: 'bed', category: 'indoor', archived_at: null },
]

function mockFetch(url) {
  if (url.includes('/api/v1/species')) {
    return Response.json(SPECIES)
  }
  if (url.includes('/api/v1/spaces')) {
    return Response.json(SPACES)
  }
  return Response.json([])
}

function Harness({ defaultSpaceId = null }) {
  const { open } = useAddPlant()
  return (
    <>
      <AddPlantDialog />
      <button type="button" onClick={() => open({ defaultSpaceId })}>
        open dialog
      </button>
    </>
  )
}

function renderWithProviders(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <AddPlantProvider>
          <ToastProvider>{ui}</ToastProvider>
        </AddPlantProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('AddPlantDialog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => mockFetch(String(url))),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is hidden until opened via the AddPlantProvider context', () => {
    renderWithProviders(<Harness />)
    expect(screen.queryByRole('dialog', { name: 'Add a plant' })).toBeNull()
  })

  it('shows the species picker step when first opened', async () => {
    renderWithProviders(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'open dialog' }))
    expect(await screen.findByRole('dialog', { name: 'Add a plant' })).toBeInTheDocument()
    // StepSpecies — search input visible
    expect(screen.getByPlaceholderText('Search species…')).toBeInTheDocument()
  })

  it('advances to the details step after picking a species', async () => {
    renderWithProviders(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'open dialog' }))
    const tile = await screen.findByRole('button', { name: /Snake Plant/ })
    fireEvent.click(tile)
    // StepDetails — nickname input + Add plant submit button
    expect(await screen.findByLabelText('Nickname')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Add plant$/ })).toBeInTheDocument()
  })

  it('Back from details returns to species picker', async () => {
    renderWithProviders(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'open dialog' }))
    fireEvent.click(await screen.findByRole('button', { name: /Snake Plant/ }))
    await screen.findByLabelText('Nickname')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByPlaceholderText('Search species…')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nickname')).toBeNull()
  })

  it('hides the space picker when opened with a defaultSpaceId', async () => {
    renderWithProviders(<Harness defaultSpaceId={10} />)
    fireEvent.click(screen.getByRole('button', { name: 'open dialog' }))
    fireEvent.click(await screen.findByRole('button', { name: /Snake Plant/ }))
    await screen.findByLabelText('Nickname')
    // Space <select> should NOT render when locked.
    expect(screen.queryByLabelText('Space')).toBeNull()
    // Adding-to context line should appear with the locked space.
    await waitFor(() => expect(screen.getByText(/Adding to/)).toBeInTheDocument())
    expect(screen.getByText(/Living Room/)).toBeInTheDocument()
  })
})
