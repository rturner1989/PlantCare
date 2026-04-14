import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TextInput from '../components/form/TextInput'
import Logo from '../components/Logo'
import Action from '../components/ui/Action'
import Card, { CardBody, CardFooter } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { useFormSubmit } from '../hooks/useFormSubmit'

function getPasswordStrength(password) {
  if (!password) return 0

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

// Map a strength score (1–4) to the Tailwind class for a filled bar segment.
// Score 0 never reaches this function in practice — at strength=0 the JSX
// check `i < strength` is always false so no bars are filled.
//   1 → coral    (weak — just meets length)
//   2 → sunshine (fair — length + mixed case)
//   3 → leaf     (good — length + case + digit)
//   4 → emerald  (strong — all four criteria including a special char)
function strengthBarClass(strength) {
  if (strength <= 1) return 'bg-coral'
  if (strength === 2) return 'bg-sunshine'
  if (strength === 3) return 'bg-leaf'
  return 'bg-emerald'
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')

  const navigate = useNavigate()
  const { register } = useAuth()
  // No client-side password-match check — Rails `has_secure_password` returns
  // `password_confirmation: ["doesn't match Password"]` alongside every other
  // validation failure (email taken, password too short, etc), so letting the
  // server validate guarantees the user sees ALL errors on a single submit
  // instead of a short-circuited subset.
  const { submitting, handleSubmit, fieldErrors, formRef } = useFormSubmit({
    action: () => register(name, email, password, passwordConfirmation),
    successMessage: 'Account created — welcome to PlantCare!',
    errorMessage: 'Registration failed',
    onSuccess: () => navigate('/welcome', { replace: true }),
  })

  const strength = getPasswordStrength(password)

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <Logo className="mb-8" />

      <h1 className="font-display text-4xl lg:text-5xl font-extrabold italic text-ink mb-8 text-center tracking-tight">
        Join the <em className="text-leaf">jungle</em>
      </h1>

      <div className="w-full max-w-auth">
        <form ref={formRef} onSubmit={handleSubmit}>
          <Card className="shadow-[var(--shadow-md)]">
            <CardBody className="space-y-4">
              <TextInput
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                autoComplete="name"
                error={fieldErrors.name}
              />

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

              <div>
                <TextInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  error={fieldErrors.password}
                />
                {password.length > 0 && !fieldErrors.password && (
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength ? strengthBarClass(strength) : 'bg-mint'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <TextInput
                label="Confirm password"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                placeholder="Confirm your password"
                autoComplete="new-password"
                error={fieldErrors.passwordConfirmation}
              />
            </CardBody>

            <CardFooter>
              <Action type="submit" variant="primary" disabled={submitting} className="w-full">
                {submitting ? 'Creating account...' : 'Create account'}
              </Action>
            </CardFooter>
          </Card>
        </form>

        <p className="mt-6 text-sm text-ink-soft text-center">
          {'Already have an account? '}
          <Action to="/login" variant="unstyled" className="text-leaf font-bold hover:underline">
            Log in
          </Action>
        </p>
      </div>
    </div>
  )
}
