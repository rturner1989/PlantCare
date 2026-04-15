import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../src/context/ToastContext'
import { useFormSubmit } from '../../src/hooks/useFormSubmit'

// Wrapper with the real ToastProvider so useToast() inside the hook resolves
// cleanly. Tests that need to verify toast output query the DOM via screen.
function wrapper({ children }) {
  return <ToastProvider>{children}</ToastProvider>
}

function makeEvent() {
  return { preventDefault: vi.fn() }
}

describe('useFormSubmit', () => {
  describe('submit lifecycle', () => {
    it('calls e.preventDefault() to stop the browser form post', async () => {
      const action = vi.fn().mockResolvedValue(undefined)
      const event = makeEvent()
      const { result } = renderHook(() => useFormSubmit({ action }), { wrapper })

      await act(async () => {
        await result.current.handleSubmit(event)
      })

      expect(event.preventDefault).toHaveBeenCalledOnce()
    })

    it('calls the action with no arguments (consumer closes over form state)', async () => {
      const action = vi.fn().mockResolvedValue(undefined)
      const { result } = renderHook(() => useFormSubmit({ action }), { wrapper })

      await act(async () => {
        await result.current.handleSubmit(makeEvent())
      })

      expect(action).toHaveBeenCalledOnce()
      expect(action).toHaveBeenCalledWith()
    })

    it('flips submitting to true during the action and back to false after', async () => {
      let resolveAction
      const action = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve
          }),
      )
      const { result } = renderHook(() => useFormSubmit({ action }), { wrapper })

      expect(result.current.submitting).toBe(false)

      let submitPromise
      act(() => {
        submitPromise = result.current.handleSubmit(makeEvent())
      })

      await waitFor(() => expect(result.current.submitting).toBe(true))

      await act(async () => {
        resolveAction()
        await submitPromise
      })

      expect(result.current.submitting).toBe(false)
    })

    it('clears submitting even when the action throws', async () => {
      const action = vi.fn().mockRejectedValue(new Error('nope'))
      const { result } = renderHook(() => useFormSubmit({ action, errorMessage: 'Fail' }), { wrapper })

      await act(async () => {
        await result.current.handleSubmit(makeEvent())
      })

      expect(result.current.submitting).toBe(false)
    })
  })

  describe('onSuccess callback', () => {
    it('fires onSuccess after the action resolves', async () => {
      const action = vi.fn().mockResolvedValue(undefined)
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useFormSubmit({ action, onSuccess }), { wrapper })

      await act(async () => {
        await result.current.handleSubmit(makeEvent())
      })

      expect(onSuccess).toHaveBeenCalledOnce()
    })

    it('does not fire onSuccess when the action throws', async () => {
      const action = vi.fn().mockRejectedValue(new Error('nope'))
      const onSuccess = vi.fn()
      const { result } = renderHook(() => useFormSubmit({ action, onSuccess, errorMessage: 'Fail' }), { wrapper })

      await act(async () => {
        await result.current.handleSubmit(makeEvent())
      })

      expect(onSuccess).not.toHaveBeenCalled()
    })
  })

  describe('toast integration', () => {
    // For toast tests, render a real form inside ToastProvider so the toast
    // container mounts — then query the DOM for the toast message.
    function TestForm({ action, successMessage, errorMessage, onSuccess }) {
      const { handleSubmit } = useFormSubmit({ action, successMessage, errorMessage, onSuccess })
      return (
        <form onSubmit={handleSubmit}>
          <button type="submit">submit</button>
        </form>
      )
    }

    it('shows a success toast with the provided successMessage on success', async () => {
      const action = vi.fn().mockResolvedValue(undefined)
      render(
        <ToastProvider>
          <TestForm action={action} successMessage="Saved!" />
        </ToastProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'submit' }))
      expect(await screen.findByText('Saved!')).toBeInTheDocument()
    })

    it('does not show a success toast when successMessage is omitted', async () => {
      const action = vi.fn().mockResolvedValue(undefined)
      const onSuccess = vi.fn()
      render(
        <ToastProvider>
          <TestForm action={action} onSuccess={onSuccess} />
        </ToastProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'submit' }))
      await waitFor(() => expect(onSuccess).toHaveBeenCalled())

      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows an error toast with the thrown error message when the action fails', async () => {
      const action = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
      render(
        <ToastProvider>
          <TestForm action={action} errorMessage="Login failed" />
        </ToastProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'submit' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials')
    })

    it('falls back to errorMessage when the thrown error has no message', async () => {
      const action = vi.fn().mockRejectedValue(new Error())
      render(
        <ToastProvider>
          <TestForm action={action} errorMessage="Login failed" />
        </ToastProvider>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'submit' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Login failed')
    })
  })
})
