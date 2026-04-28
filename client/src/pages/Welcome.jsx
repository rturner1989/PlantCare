import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getIntentConfig,
  nextVisibleStep,
  pathForStep,
  previousVisibleStep,
  stepFromSlug,
} from '../components/onboarding/intentConfig'
import Step0Welcome from '../components/onboarding/Step0Welcome'
import Step1Intent from '../components/onboarding/Step1Intent'
import Step2Spaces from '../components/onboarding/Step2Spaces'
import Step3Plants from '../components/onboarding/Step3Plants'
import Step4Environment from '../components/onboarding/Step4Environment'
import Step5StakesPlaceholder from '../components/onboarding/Step5StakesPlaceholder'
import Step6JournalPlaceholder from '../components/onboarding/Step6JournalPlaceholder'
import Step7Done from '../components/onboarding/Step7Done'
import WizardCard from '../components/onboarding/shared/WizardCard'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { usePlants } from '../hooks/usePlants'
import { useSpaces } from '../hooks/useSpaces'
import { useSpeciesSearch } from '../hooks/useSpecies'

const stepVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function Welcome() {
  const { step: slug } = useParams()
  const step = stepFromSlug(slug)

  const navigate = useNavigate()
  const { user, updateUser, markOnboarded } = useAuth()
  const toast = useToast()
  const shouldReduceMotion = useReducedMotion()

  const intent = user?.onboarding_intent ?? null
  const intentConfig = getIntentConfig(intent)

  const [finishing, setFinishing] = useState(false)

  const { data: createdPlants = [] } = usePlants()

  useEffect(() => {
    if (user?.onboarded) {
      navigate('/', { replace: true })
    }
  }, [user?.onboarded, navigate])

  const { data: existingSpaces } = useSpaces({ enabled: !user?.onboarded })
  useSpeciesSearch('')

  const goToStep = useCallback(
    (target) => {
      navigate(pathForStep(target))
    },
    [navigate],
  )

  const persistStepReached = useCallback(
    async (target) => {
      try {
        await updateUser({ onboarding_step_reached: target })
      } catch (err) {
        toast.error(err.message ?? "Couldn't save your progress — try again.")
      }
    },
    [updateUser, toast],
  )

  const handleNext = useCallback(() => {
    const target = nextVisibleStep(step, intent)
    if (target === step) return
    goToStep(target)
    persistStepReached(target)
  }, [step, intent, goToStep, persistStepReached])

  const handleBack = useCallback(() => {
    const target = previousVisibleStep(step, intent)
    goToStep(target)
  }, [step, intent, goToStep])

  const handleSetIntent = useCallback(
    async (chosenIntent) => {
      try {
        await updateUser({ onboarding_intent: chosenIntent, onboarding_step_reached: 2 })
        goToStep(2)
      } catch (err) {
        toast.error(err.message ?? "Couldn't save your intent — try again.")
      }
    },
    [updateUser, goToStep, toast],
  )

  const handlePlantsAdded = useCallback(() => {
    handleNext()
  }, [handleNext])

  const handleFinish = useCallback(async () => {
    setFinishing(true)
    try {
      await markOnboarded()
      localStorage.setItem('plantcare_tour_pending', 'true')
      const route = intentConfig?.completionRoute ?? '/'
      navigate(route, { replace: true })
    } catch (err) {
      toast.error(err.message ?? "Couldn't finish setup — please try again")
      setFinishing(false)
    }
  }, [markOnboarded, navigate, intentConfig, toast])

  const needsSpaces = step === 2 || step === 3 || step === 4
  if (needsSpaces && existingSpaces === undefined) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Spinner />
      </div>
    )
  }

  function renderStep() {
    if (step === 0) return <Step0Welcome onNext={handleNext} />
    if (step === 1) return <Step1Intent initialIntent={intent} onBack={handleBack} onContinue={handleSetIntent} />
    if (step === 2) return <Step2Spaces onBack={handleBack} onComplete={handleNext} />
    if (step === 3)
      return <Step3Plants availableSpaces={existingSpaces} onBack={handleBack} onComplete={handlePlantsAdded} />
    if (step === 4) return <Step4Environment onBack={handleBack} onContinue={handleNext} />
    if (step === 5) return <Step5StakesPlaceholder onBack={handleBack} onContinue={handleNext} />
    if (step === 6) return <Step6JournalPlaceholder onBack={handleBack} onContinue={handleNext} />
    if (step === 7) return <Step7Done createdPlants={createdPlants} onFinish={handleFinish} finishing={finishing} />

    return null
  }

  const content = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
        className="flex-1 flex flex-col min-h-0"
      >
        {renderStep()}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      {step === 0 ? content : <WizardCard>{content}</WizardCard>}
    </div>
  )
}
