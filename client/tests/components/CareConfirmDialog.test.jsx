import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import CareConfirmDialog from '../../src/components/CareConfirmDialog'

const renderDialog = (props) =>
  render(
    <MemoryRouter>
      <CareConfirmDialog {...props} />
    </MemoryRouter>,
  )

const plant = (overrides = {}) => ({
  id: 1,
  nickname: 'Monty',
  species: { id: 1, common_name: 'Monstera', personality: 'dramatic' },
  ...overrides,
})

describe('CareConfirmDialog', () => {
  describe('visibility', () => {
    it('renders nothing when plant is missing', () => {
      const { container } = renderDialog({
        open: true,
        onClose: () => {},
        onConfirm: () => {},
        plant: null,
        careType: 'watering',
      })
      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when open is false', () => {
      renderDialog({
        open: false,
        onClose: () => {},
        onConfirm: () => {},
        plant: plant(),
        careType: 'watering',
      })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('content', () => {
    it('shows the plant nickname in the header + confirm button', () => {
      renderDialog({
        open: true,
        onClose: () => {},
        onConfirm: () => {},
        plant: plant(),
        careType: 'watering',
      })
      const headings = screen.getAllByText(/Water Monty\??/)
      expect(headings.length).toBeGreaterThanOrEqual(2)
      expect(screen.getByRole('button', { name: /^Water Monty$/ })).toBeInTheDocument()
    })

    it('switches verb + button label for feeding careType', () => {
      renderDialog({
        open: true,
        onClose: () => {},
        onConfirm: () => {},
        plant: plant(),
        careType: 'feeding',
      })
      expect(screen.getByRole('button', { name: /^Feed Monty$/ })).toBeInTheDocument()
    })

    it('renders a personality-driven quote from the confirmQuotes pool', () => {
      renderDialog({
        open: true,
        onClose: () => {},
        onConfirm: () => {},
        plant: plant(),
        careType: 'watering',
      })
      // dramatic personality quotes all contain specific dramatic strings
      const dramaticQuotes = [/WAIT/, /commitment/i, /ready/i, /History/]
      const body = screen.getByRole('dialog').textContent
      expect(dramaticQuotes.some((pattern) => pattern.test(body))).toBe(true)
    })
  })

  describe('actions', () => {
    it('fires onClose when Cancel is clicked', () => {
      const onClose = vi.fn()
      renderDialog({
        open: true,
        onClose,
        onConfirm: () => {},
        plant: plant(),
        careType: 'watering',
      })
      fireEvent.click(screen.getByRole('button', { name: /^Cancel$/ }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('fires onConfirm when the primary action is clicked', () => {
      const onConfirm = vi.fn()
      renderDialog({
        open: true,
        onClose: () => {},
        onConfirm,
        plant: plant(),
        careType: 'watering',
      })
      fireEvent.click(screen.getByRole('button', { name: /^Water Monty$/ }))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('fires onClose when the header close icon is clicked', () => {
      const onClose = vi.fn()
      renderDialog({
        open: true,
        onClose,
        onConfirm: () => {},
        plant: plant(),
        careType: 'watering',
      })
      fireEvent.click(screen.getByRole('button', { name: /^Close$/ }))
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('submitting state', () => {
    it('disables both action buttons while submitting', () => {
      renderDialog({
        open: true,
        onClose: () => {},
        onConfirm: () => {},
        plant: plant(),
        careType: 'watering',
        submitting: true,
      })
      expect(screen.getByRole('button', { name: /^Cancel$/ })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Watering/ })).toBeDisabled()
    })

    it('shows the pending verb label on the primary button', () => {
      renderDialog({
        open: true,
        onClose: () => {},
        onConfirm: () => {},
        plant: plant(),
        careType: 'feeding',
        submitting: true,
      })
      expect(screen.getByRole('button', { name: /Feeding/ })).toBeInTheDocument()
    })
  })
})
