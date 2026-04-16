import { useState } from 'react'
import { apiPost } from '../api/client'
import TextInput from '../components/form/TextInput'
import Logo from '../components/Logo'
import Action from '../components/ui/Action'
import Card, { CardBody, CardFooter } from '../components/ui/Card'
import { useFormSubmit } from '../hooks/useFormSubmit'

function SentCard({ email }) {
  return (
    <Card className="shadow-[var(--shadow-md)]">
      <CardBody>
        <p className="text-sm text-ink font-semibold mb-2">Check your inbox</p>
        <p className="text-sm text-ink-soft leading-snug">
          If an account exists for <strong className="text-ink">{email}</strong>, we&rsquo;ve sent you a link to reset
          your password. The link expires in 24 hours.
        </p>
      </CardBody>
      <CardFooter>
        <Action to="/login" variant="secondary" className="w-full">
          Back to login
        </Action>
      </CardFooter>
    </Card>
  )
}

function RequestForm({ email, onEmailChange, submitting, handleSubmit, formRef }) {
  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Card className="shadow-[var(--shadow-md)]">
        <CardBody>
          <p className="text-sm text-ink-soft leading-snug mb-4">
            Enter the email you signed up with and we&rsquo;ll send you a link to reset your password.
          </p>
          <TextInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </CardBody>
        <CardFooter>
          <Action type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? 'Sending...' : 'Send reset link'}
          </Action>
        </CardFooter>
      </Card>
    </form>
  )
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const { submitting, handleSubmit, formRef } = useFormSubmit({
    action: () => apiPost('/api/v1/password_resets', { password_reset: { email } }),
    errorMessage: "Couldn't send reset email",
    onSuccess: () => setSent(true),
  })

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8 sm:py-12">
      <Logo className="mb-6 sm:mb-8" />

      <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold italic text-ink mb-6 sm:mb-8 text-center tracking-tight">
        Forgot <em className="text-leaf">password</em>?
      </h1>

      <div className="w-full max-w-auth">
        {sent ? (
          <SentCard email={email} />
        ) : (
          <RequestForm
            email={email}
            onEmailChange={setEmail}
            submitting={submitting}
            handleSubmit={handleSubmit}
            formRef={formRef}
          />
        )}

        <p className="mt-6 text-sm text-ink-soft text-center">
          {'Remembered it? '}
          <Action to="/login" variant="unstyled" className="text-leaf font-bold hover:underline">
            Log in
          </Action>
        </p>
      </div>
    </div>
  )
}
