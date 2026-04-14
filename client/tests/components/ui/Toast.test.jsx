import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ToastContainer from '../../../src/components/ui/Toast'

describe('ToastContainer', () => {
  it('renders no toast elements when given an empty list', () => {
    render(<ToastContainer toasts={[]} onDismiss={() => {}} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders a toast with its message text', () => {
    const toasts = [{ id: 1, kind: 'info', message: 'Hello there' }]
    render(<ToastContainer toasts={toasts} onDismiss={() => {}} />)
    expect(screen.getByText('Hello there')).toBeInTheDocument()
  })

  it('renders multiple toasts in order', () => {
    const toasts = [
      { id: 1, kind: 'success', message: 'First' },
      { id: 2, kind: 'error', message: 'Second' },
    ]
    render(<ToastContainer toasts={toasts} onDismiss={() => {}} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  describe('accessibility roles', () => {
    it('uses role="alert" for error toasts so screen readers interrupt', () => {
      render(<ToastContainer toasts={[{ id: 1, kind: 'error', message: 'Something failed' }]} onDismiss={() => {}} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Something failed')
    })

    it('uses role="status" for non-error toasts (success / info / warning)', () => {
      const toasts = [
        { id: 1, kind: 'success', message: 'Saved' },
        { id: 2, kind: 'info', message: 'FYI' },
        { id: 3, kind: 'warning', message: 'Watch out' },
      ]
      render(<ToastContainer toasts={toasts} onDismiss={() => {}} />)
      expect(screen.getAllByRole('status')).toHaveLength(3)
    })
  })

  describe('dismiss', () => {
    it('calls onDismiss with the toast id when the close button is clicked', async () => {
      const onDismiss = vi.fn()
      const toasts = [{ id: 42, kind: 'info', message: 'Hi' }]
      render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />)

      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
      expect(onDismiss).toHaveBeenCalledWith(42)
    })
  })

  describe('unknown kinds', () => {
    it('falls back to info styling (role="status") for unknown kinds', () => {
      render(<ToastContainer toasts={[{ id: 1, kind: 'nonsense', message: 'Oops' }]} onDismiss={() => {}} />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})
