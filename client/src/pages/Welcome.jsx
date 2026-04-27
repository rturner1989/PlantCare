import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Step1Intro from '../components/onboarding/Step1Intro'
import Step2Spaces from '../components/onboarding/Step2Spaces'
import Step3Species from '../components/onboarding/Step3Species'
import Step4Environment from '../components/onboarding/Step4Environment'
import Step5Done from '../components/onboarding/Step5Done'
import WizardCard from '../components/onboarding/WizardCard'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { usePlants } from '../hooks/usePlants'
import { useSpaces } from '../hooks/useSpaces'
import { useSpeciesSearch } from '../hooks/useSpecies'

const STEP_BY_SLUG = { '': 1, spaces: 2, species: 3, environment: 4, done: 5 }
const SLUG_BY_STEP = { 1: '', 2: 'spaces', 3: 'species', 4: 'environment', 5: 'done' }
const TOTAL_STEPS = Object.keys(STEP_BY_SLUG).length

function stepPath(step) {
  const slug = SLUG_BY_STEP[step]
  return slug ? `/welcome/${slug}` : '/welcome'
}

const SLIDE_OFFSET = 40
const stepVariants = {
  enter: (direction) => ({
    x: direction === 0 ? 0 : direction * SLIDE_OFFSET,
    opacity: direction === 0 ? 1 : 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction * -SLIDE_OFFSET,
    opacity: 0,
  }),
}

export default function Welcome() {
  const { step: slug } = useParams()
  const step = STEP_BY_SLUG[slug ?? '']

  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [nickname, setNickname] = useState('')
  const [spaceId, setSpaceId] = useState(null)
  const [finishing, setFinishing] = useState(false)

  // Plants are the server's source of truth — this survives page reloads mid-wizard
  // where a useState-only list would reset to empty and the user would lose their
  // "Add another" button + avatar row on Step 5.
  const { data: createdPlants = [] } = usePlants()

  const navigate = useNavigate()
  const { user, markOnboarded } = useAuth()
  const toast = useToast()
  const shouldReduceMotion = useReducedMotion()

  // Ref updated in useEffect (not inline) so direction compares against the
  // previous *committed* step.
  const previousStepRef = useRef(step)
  const direction = step > previousStepRef.current ? 1 : step < previousStepRef.current ? -1 : 0
  useEffect(() => {
    previousStepRef.current = step
  }, [step])

  const { data: existingSpaces } = useSpaces({ enabled: !user?.onboarded })
  // Warm the species cache so Step 3's entrance animation doesn't stutter
  // against an in-flight fetch.
  useSpeciesSearch('')

  useEffect(() => {
    if (step === undefined) navigate('/welcome', { replace: true })
  }, [step, navigate])

  useEffect(() => {
    if (user?.onboarded) {
      navigate('/', { replace: true })
    }
  }, [user?.onboarded, navigate])

  if (step === undefined) return null

  // Not isFetching — post-mutation background revalidation would re-fire the gate and unmount
  // the AnimatePresence shell mid-navigation.
  const needsSpaces = step === 2 || step === 3
  if (needsSpaces && existingSpaces === undefined) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Spinner />
      </div>
    )
  }

  function handleSpeciesChosen(species, chosenNickname, chosenSpaceId) {
    setSelectedSpecies(species)
    setNickname(chosenNickname)
    setSpaceId(chosenSpaceId)
    navigate(stepPath(species ? 4 : 5))
  }

  function handlePlantCreated() {
    navigate(stepPath(5))
  }

  function handleAddAnother() {
    setSelectedSpecies(null)
    setNickname('')
    setSpaceId(null)
    navigate(stepPath(3))
  }

  // Stay on Step 5 on failure — navigating with `onboarded: false` would have
  // ProtectedRoute bounce the user straight back here.
  async function handleFinish() {
    setFinishing(true)
    try {
      await markOnboarded()
      localStorage.setItem('plantcare_tour_pending', 'true')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err.message || "Couldn't finish setup — please try again")
      setFinishing(false)
    }
  }

  return (
    <div className="flex flex-col h-dvh px-5 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:justify-center sm:h-auto sm:min-h-dvh">
      <WizardCard step={step} total={TOTAL_STEPS}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.33, 1, 0.68, 1] }}
            className="flex-1 flex flex-col min-h-0"
          >
            {step === 1 && <Step1Intro onNext={() => navigate(stepPath(2))} />}
            {step === 2 && (
              <Step2Spaces
                initialSpaces={existingSpaces}
                onBack={() => navigate(stepPath(1))}
                onComplete={() => navigate(stepPath(3))}
              />
            )}
            {step === 3 && (
              <Step3Species
                availableSpaces={existingSpaces}
                createdPlants={createdPlants}
                initialSpecies={selectedSpecies}
                initialNickname={nickname}
                initialSpaceId={spaceId}
                onBack={() => navigate(stepPath(2))}
                onComplete={handleSpeciesChosen}
              />
            )}
            {step === 4 && (
              <Step4Environment
                species={selectedSpecies}
                nickname={nickname}
                spaceId={spaceId}
                onBack={() => navigate(stepPath(3))}
                onComplete={handlePlantCreated}
              />
            )}
            {step === 5 && (
              <Step5Done
                createdPlants={createdPlants}
                onAddAnother={handleAddAnother}
                onFinish={handleFinish}
                finishing={finishing}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </WizardCard>
    </div>
  )
}
