import { useState } from 'react'
import { apiPost } from '../api/client'
import AuthCard from '../components/auth/AuthCard'
import DisplayEm from '../components/auth/DisplayEm'
import TextInput from '../components/form/TextInput'
import Action from '../components/ui/Action'
import { useFormSubmit } from '../hooks/useFormSubmit'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { submitting, handleSubmit, formRef } = useFormSubmit({
    action: () => apiPost('/api/v1/password_resets', { password_reset: { email } }),
    errorMessage: "Couldn't send reset email",
    onSuccess: () => setSent(true),
  })

  if (sent) {
    return (
      <AuthCard
        preheading="Check your email"
        heading={
          <>
            On its <DisplayEm>way</DisplayEm>
          </>
        }
        subtitle={
          <>
            Reset link sent to <strong className="text-ink font-bold">{email}</strong>. Check your inbox — valid for one
            hour, one-time use.
          </>
        }
        showSocial={false}
        showCrossAuth={false}
      >
        <Action to="/login" variant="secondary" className="w-full">
          Back to login
        </Action>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      preheading="Reset password"
      heading={
        <>
          Forgot your <DisplayEm>password</DisplayEm>?
        </>
      }
      subtitle="Enter the email you signed up with. We'll send a reset link — valid for one hour, one-time use."
      showSocial={false}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Action type="submit" variant="primary" disabled={submitting} className="w-full">
          {submitting ? 'Sending...' : 'Send reset link'}
        </Action>
      </form>
    </AuthCard>
  )
}
