import { Outlet, useParams } from 'react-router-dom'
import Logo from '../components/Logo'
import {
  getIntentConfig,
  LAST_STEP,
  STEP_NAMES,
  stepFromSlug,
  TOTAL_STEPS,
} from '../components/onboarding/intentConfig'
import StepProgress from '../components/onboarding/shared/StepProgress'
import { useAuth } from '../hooks/useAuth'

export default function OnboardingLayout() {
  const { step: slug } = useParams()
  const step = stepFromSlug(slug)

  const { user } = useAuth()
  const intent = user?.onboarding_intent ?? null
  const intentConfig = getIntentConfig(intent)
  const skipSteps = intentConfig?.skipSteps ?? []

  const showProgress = step > 0
  const isLastStep = step === LAST_STEP

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[image:var(--gradient-mint)]">
      <div
        aria-hidden="true"
        className="onboarding-blob onboarding-blob-mint pointer-events-none absolute"
        style={{ width: '480px', height: '480px', top: '-180px', right: '-200px' }}
      />
      <div
        aria-hidden="true"
        className="onboarding-blob onboarding-blob-sun pointer-events-none absolute"
        style={{ width: '380px', height: '380px', bottom: '-140px', left: '-120px' }}
      />

      <div className="relative z-10 min-h-dvh flex flex-col">
        <header className="flex items-center justify-between px-6 py-5 sm:px-10 sm:py-6">
          <Logo />
        </header>

        {showProgress && (
          <div className="px-6 sm:px-10 max-w-[820px] w-full mx-auto">
            <StepProgress step={step} total={TOTAL_STEPS} skipSteps={skipSteps} />
            <p className="mt-2 mb-4 text-[10px] font-extrabold text-emerald uppercase tracking-wider">
              {isLastStep ? STEP_NAMES[LAST_STEP] : `Step ${step} of ${TOTAL_STEPS} · ${STEP_NAMES[step]}`}
            </p>
          </div>
        )}

        <main className="flex-1 flex flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-10 sm:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
