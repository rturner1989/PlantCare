import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../components/form/TextInput'
import Logo from '../components/Logo'
import Action from '../components/ui/Action'
import Card, { CardBody, CardFooter } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useFormSubmit } from '../hooks/useFormSubmit'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()
  const { login } = useAuth()

  const { submitting, handleSubmit, fieldErrors, formRef } = useFormSubmit({
    action: () => login(email, password),
    successMessage: 'Welcome back!',
    errorMessage: 'Login failed',
    // Auth failures (401) aren't tied to a single field, but UX-wise we
    // surface the message under email so the user gets the same red-border
    // + focus treatment they'd see for a 422 validation error elsewhere.
    errorField: 'email',
    onSuccess: () => navigate('/', { replace: true }),
  })

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />

      <h1 className="font-display text-4xl lg:text-5xl font-extrabold italic text-ink mb-8 text-center tracking-tight">
        Welcome <em className="text-leaf">back</em>
      </h1>

      <div className="w-full max-w-auth">
        <form ref={formRef} onSubmit={handleSubmit}>
          <Card className="shadow-[var(--shadow-md)]">
            <CardBody className="space-y-4">
              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                error={fieldErrors.email}
              />

              <TextInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                autoComplete="current-password"
              />

              <div className="text-right">
                <Action to="/forgot-password" variant="unstyled" className="text-xs text-ink-soft hover:text-leaf">
                  Forgot password?
                </Action>
              </div>
            </CardBody>

            <CardFooter>
              <Action type="submit" variant="primary" disabled={submitting} className="w-full">
                {submitting ? 'Logging in...' : 'Log in'}
              </Action>
            </CardFooter>
          </Card>
        </form>

        <p className="mt-6 text-sm text-ink-soft text-center">
          {"Don't have an account? "}
          <Action to="/register" variant="unstyled" className="text-leaf font-bold hover:underline">
            Sign up
          </Action>
        </p>
      </div>
    </div>
  )
}
