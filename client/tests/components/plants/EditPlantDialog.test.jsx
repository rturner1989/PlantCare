import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EditPlantDialog from '../../../src/components/plants/EditPlantDialog'
import { ToastProvider } from '../../../src/context/ToastContext'

const PLANT = {
  id: 7,
  nickname: 'Monty',
  notes: 'A leafy friend',
  space_id: 10,
  space: { id: 10, name: 'Living Room' },
  species: { id: 1, common_name: 'Monstera' },
}

const SPACES = [
  { id: 10, name: 'Living Room', icon: 'couch', archived_at: null },
  { id: 11, name: 'Bedroom', icon: 'bed', archived_at: null },
]

let patchedBody = null

function defaultMockFetch(url, init) {
  if (url.includes('/api/v1/spaces')) {
    return Response.json(SPACES)
  }
  if (url.includes(`/api/v1/plants/${PLANT.id}`) && init?.method === 'PATCH') {
    patchedBody = JSON.parse(init.body)
    return Response.json({ ...PLANT, ...patchedBody.plant })
  }
  return Response.json({})
}

function renderWithProviders(ui) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <ToastProvider>{ui}</ToastProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('EditPlantDialog', () => {
  beforeEach(() => {
    patchedBody = null
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => defaultMockFetch(String(url), init)),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('pre-fills nickname, space, and notes from the plant prop', async () => {
    renderWithProviders(<EditPlantDialog plant={PLANT} open onClose={() => {}} />)
    expect(await screen.findByDisplayValue('Monty')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A leafy friend')).toBeInTheDocument()
    await waitFor(() => {
      const select = screen.getByLabelText('Space')
      expect(select.value).toBe('10')
    })
  })

  it('disables Save changes until a field changes', async () => {
    renderWithProviders(<EditPlantDialog plant={PLANT} open onClose={() => {}} />)
    const save = screen.getByRole('button', { name: /^Save changes$/ })
    expect(save).toBeDisabled()

    const nicknameInput = await screen.findByDisplayValue('Monty')
    fireEvent.change(nicknameInput, { target: { value: 'Monty II' } })
    await waitFor(() => expect(save).not.toBeDisabled())
  })

  it('submits a PATCH with the edited fields and closes', async () => {
    const onClose = vi.fn()
    renderWithProviders(<EditPlantDialog plant={PLANT} open onClose={onClose} />)

    const nicknameInput = await screen.findByDisplayValue('Monty')
    fireEvent.change(nicknameInput, { target: { value: 'Monty II' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save changes$/ }))

    await waitFor(() => expect(patchedBody).not.toBeNull())
    expect(patchedBody.plant).toMatchObject({
      nickname: 'Monty II',
      space_id: 10,
      notes: 'A leafy friend',
    })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('renders the delete-link only when onDeleteRequest is provided', () => {
    const { rerender } = renderWithProviders(<EditPlantDialog plant={PLANT} open onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /Delete plant/i })).toBeNull()

    rerender(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <ToastProvider>
            <EditPlantDialog plant={PLANT} open onClose={() => {}} onDeleteRequest={() => {}} />
          </ToastProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /Delete plant/i })).toBeInTheDocument()
  })
})
