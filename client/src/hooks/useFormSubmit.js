import { useState } from 'react'
import { useToast } from '../context/ToastContext'

/**
 * useFormSubmit — wraps the common "async form submit" lifecycle used by
 * auth forms (Login, Register), onboarding steps, Add Plant, profile update,
 * password change, and any other form in the app that follows the same
 * shape: preventDefault → submitting=true → await action → toast on both
 * paths → submitting=false.
 *
 * Usage:
 *
 *   const { submitting, handleSubmit } = useFormSubmit({
 *     action: () => login(email, password),
 *     successMessage: 'Welcome back!',
 *     errorMessage: 'Login failed',
 *     onSuccess: () => navigate(from, { replace: true }),
 *   })
 *
 *   return <form onSubmit={handleSubmit}>...</form>
 *
 * Design notes:
 *
 * - `action` is a no-arg thunk so the hook doesn't need to know anything
 *   about the action's argument shape. Consumers close over their form
 *   state in the thunk. Same API for login(a,b), register(a,b,c,d), or
 *   updateProfile({...}).
 *
 * - `successMessage` is optional — omit it for forms whose success path is
 *   self-evident (e.g. a wizard advancing to the next step doesn't need a
 *   "Step saved" toast).
 *
 * - `onSuccess` is a callback, not a navigate prop. Consumers decide what
 *   happens after success: navigate, close a modal, refetch, or nothing.
 *
 * - On error, the hook prefers the thrown error's `.message` and falls back
 *   to `errorMessage` if the error has none. If neither is available, it
 *   shows a generic "Something went wrong".
 */
export function useFormSubmit({ action, successMessage, errorMessage, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await action()
      if (successMessage) {
        toast.success(successMessage)
      }
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || errorMessage || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return { submitting, handleSubmit }
}
