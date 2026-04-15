import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '../../src/context/ToastContext'

describe('ToastContext', () => {
  describe('useToast hook', () => {
    it('throws when used outside a ToastProvider', () => {
      // Suppress React's error-boundary warning in test output
      const originalError = console.error
      console.error = vi.fn()

      function BadComponent() {
        useToast()
        return null
      }

      expect(() => render(<BadComponent />)).toThrow('useToast must be used within a ToastProvider')

      console.error = originalError
    })
  })

  describe('showing toasts', () => {
    function Trigger({ onClick, label = 'trigger' }) {
      return (
        <button type="button" onClick={onClick}>
          {label}
        </button>
      )
    }

    it('renders a success toast when toast.success() is called', async () => {
      function App() {
        const toast = useToast()
        return <Trigger onClick={() => toast.success('Saved!')} />
      }
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'trigger' }))
      expect(screen.getByText('Saved!')).toBeInTheDocument()
    })

    it('renders an error toast with role="alert"', async () => {
      function App() {
        const toast = useToast()
        return <Trigger onClick={() => toast.error('Nope')} />
      }
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'trigger' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Nope')
    })

    it('stacks multiple toasts in the order they were triggered', async () => {
      function App() {
        const toast = useToast()
        return (
          <>
            <Trigger onClick={() => toast.info('First')} label="first" />
            <Trigger onClick={() => toast.info('Second')} label="second" />
          </>
        )
      }
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'first' }))
      await userEvent.click(screen.getByRole('button', { name: 'second' }))
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
    })
  })

  describe('dismissing toasts manually', () => {
    it('removes the toast when the user clicks the dismiss button', async () => {
      function App() {
        const toast = useToast()
        return (
          <button type="button" onClick={() => toast.info('Hi')}>
            trigger
          </button>
        )
      }
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'trigger' }))
      expect(screen.getByText('Hi')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
      // Wait for the Framer Motion exit animation to finish before asserting
      // the DOM is actually cleared — AnimatePresence keeps components mounted
      // until the exit animation completes.
      await waitFor(() => {
        expect(screen.queryByText('Hi')).not.toBeInTheDocument()
      })
    })
  })

  // These use real timers with short (50-100ms) durations instead of fake timers.
  // Mixing Vitest's fake timers with userEvent's async click deadlocks because
  // userEvent's internal scheduling uses setTimeout under the hood — simpler to
  // just use small real durations and waitFor.
  describe('auto-dismiss', () => {
    it('auto-dismisses a toast after its duration elapses', async () => {
      function App() {
        const toast = useToast()
        return (
          <button type="button" onClick={() => toast.info('Bye soon', { duration: 50 })}>
            trigger
          </button>
        )
      }
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'trigger' }))
      expect(screen.getByText('Bye soon')).toBeInTheDocument()

      await waitFor(
        () => {
          expect(screen.queryByText('Bye soon')).not.toBeInTheDocument()
        },
        { timeout: 500 },
      )
    })

    it('does not auto-dismiss when { persist: true } is passed', async () => {
      function App() {
        const toast = useToast()
        return (
          <button type="button" onClick={() => toast.info('Sticky', { persist: true })}>
            trigger
          </button>
        )
      }
      render(
        <ToastProvider>
          <App />
        </ToastProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'trigger' }))
      expect(screen.getByText('Sticky')).toBeInTheDocument()

      // Wait longer than any reasonable auto-dismiss duration — still there.
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(screen.getByText('Sticky')).toBeInTheDocument()
    })
  })
})
