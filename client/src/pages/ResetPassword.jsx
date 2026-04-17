import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiPatch } from '../api/client'
import PasswordStrengthBar from '../components/form/PasswordStrengthBar'
import TextInput from '../components/form/TextInput'
import Logo from '../components/Logo'
import Action from '../components/ui/Action'
import Card, { CardBody, CardFooter } from '../components/ui/Card'
import { useToast } from '../context/ToastContext'
import { useFormSubmit } from '../hooks/useFormSubmit'

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [expired, setExpired] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  // 410 Gone isn't a success (don't toast/navigate) AND isn't a field
  // error (useFormSubmit's ValidationError branch) — it's a whole-view
  // swap. Catch it in the action, record the outcome on a ref, and let
  // onSuccess gate the happy-path side effects on it.
  const outcomeRef = useRef(null)

  const { submitting, handleSubmit, fieldErrors, formRef } = useFormSubmit({
    action: async () => {
      try {
        await apiPatch(`/api/v1/password_resets/${token}`, {
          password_reset: { password, password_confirmation: passwordConfirmation },
        })
        outcomeRef.current = 'success'
      } catch (err) {
        if (err.status === 410) {
          outcomeRef.current = 'expired'
          setExpired(true)
          return
        }
        throw err
      }
    },
    errorMessage: "Couldn't update your password",
    onSuccess: () => {
      if (outcomeRef.current !== 'success') return
      toast.success('Password updated — log in with your new one.')
      navigate('/login', { replace: true })
    },
  })

  if (expired) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8 sm:py-12">
        <Logo className="mb-6 sm:mb-8" />
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold italic text-ink mb-6 sm:mb-8 text-center tracking-tight">
          Link <em className="text-coral-deep">expired</em>
        </h1>
        <div className="w-full max-w-auth">
          <Card className="shadow-[var(--shadow-md)]">
            <CardBody>
              <p className="text-sm text-ink-soft leading-snug">
                This reset link has already been used or has expired. Request a fresh one and we&rsquo;ll send you
                another.
              </p>
            </CardBody>
            <CardFooter>
              <Action to="/forgot-password" variant="primary" className="w-full">
                Request a new link
              </Action>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8 sm:py-12">
      <Logo className="mb-6 sm:mb-8" />

      <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold italic text-ink mb-6 sm:mb-8 text-center tracking-tight">
        Choose a new <em className="text-leaf">password</em>
      </h1>

      <div className="w-full max-w-auth">
        <form ref={formRef} onSubmit={handleSubmit}>
          <Card className="shadow-[var(--shadow-md)]">
            <CardBody className="space-y-4">
              <div>
                <TextInput
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8+ characters with a letter and a number"
                  autoComplete="new-password"
                  error={fieldErrors.password}
                />
                {!fieldErrors.password && <PasswordStrengthBar password={password} />}
              </div>

              <TextInput
                label="Confirm new password"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                placeholder="Confirm your new password"
                autoComplete="new-password"
                error={fieldErrors.passwordConfirmation}
              />
            </CardBody>

            <CardFooter>
              <Action type="submit" variant="primary" disabled={submitting} className="w-full">
                {submitting ? 'Updating...' : 'Update password'}
              </Action>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
