import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/ui/Spinner'
import Step1Intro from '../components/welcome/Step1Intro'
import Step2Rooms from '../components/welcome/Step2Rooms'
import Step3Species from '../components/welcome/Step3Species'
import Step4Environment from '../components/welcome/Step4Environment'
import Step5Done from '../components/welcome/Step5Done'
import WizardCard from '../components/welcome/WizardCard'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { useRooms } from '../hooks/useRooms'
import { useSpeciesSearch } from '../hooks/useSpecies'

const STEP_BY_SLUG = { '': 1, rooms: 2, species: 3, environment: 4, done: 5 }
const SLUG_BY_STEP = { 1: '', 2: 'rooms', 3: 'species', 4: 'environment', 5: 'done' }
const TOTAL_STEPS = Object.keys(STEP_BY_SLUG).length

function stepPath(step) {
  const slug = SLUG_BY_STEP[step]
  return slug ? `/welcome/${slug}` : '/welcome'
}

// Direction-aware slide variants for the step transitions. `custom` is
// 1 for forward (Continue / Next), -1 for back (Back / browser back),
// 0 on first mount so we skip the entrance animation. Each step slides
// horizontally with a fade; AnimatePresence mode="wait" ensures the
// outgoing step finishes leaving before the incoming one arrives.
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
  const [roomId, setRoomId] = useState(null)
  const [finishing, setFinishing] = useState(false)

  const navigate = useNavigate()
  const { user, markOnboarded } = useAuth()
  const toast = useToast()
  const shouldReduceMotion = useReducedMotion()

  // Derive slide direction from the step delta: track what the previous
  // step was in a ref, compare to the current render's step. Updating the
  // ref inside useEffect (not inline during render) so the direction is
  // computed from the PREVIOUS committed step, not the one we're about to
  // commit.
  const previousStepRef = useRef(step)
  const direction = step > previousStepRef.current ? 1 : step < previousStepRef.current ? -1 : 0
  useEffect(() => {
    previousStepRef.current = step
  }, [step])

  const { data: existingRooms, isFetching: roomsFetching } = useRooms({ enabled: !user?.onboarded })
  // Prefetch popular species here so the cache is warm by the time the
  // user reaches Step 3. Without it, Step 3's first mount fires the
  // network request synchronously with its entrance animation — the
  // spinner swap inside SearchField made the step transition stutter.
  // Subsequent visits hit the 5-min TanStack cache and stay smooth.
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

  // Don't mount Step 2/3 until rooms are both loaded AND not mid-refetch.
  // Step 2 and Step 3 each seed from props via useState lazy init — so
  // stale data at mount (undefined on refresh, or the old cache value
  // during a post-mutation refetch) would silently freeze the step with
  // the wrong selections and no auto-resync.
  const needsRooms = step === 2 || step === 3
  if (needsRooms && (existingRooms === undefined || roomsFetching)) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Spinner />
      </div>
    )
  }

  function handleSpeciesChosen(species, chosenNickname, chosenRoomId) {
    setSelectedSpecies(species)
    setNickname(chosenNickname)
    setRoomId(chosenRoomId)
    navigate(stepPath(species ? 4 : 5))
  }

  // On failure we keep the user on Step 5 rather than navigating; silent
  // navigation would leave them with `onboarded: false` and ProtectedRoute
  // would bounce them straight back here.
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
              <Step2Rooms
                initialRooms={existingRooms}
                onBack={() => navigate(stepPath(1))}
                onComplete={() => navigate(stepPath(3))}
              />
            )}
            {step === 3 && (
              <Step3Species
                availableRooms={existingRooms}
                initialSpecies={selectedSpecies}
                initialNickname={nickname}
                initialRoomId={roomId}
                onBack={() => navigate(stepPath(2))}
                onComplete={handleSpeciesChosen}
              />
            )}
            {step === 4 && (
              <Step4Environment
                species={selectedSpecies}
                nickname={nickname}
                roomId={roomId}
                onBack={() => navigate(stepPath(3))}
                onComplete={() => navigate(stepPath(5))}
              />
            )}
            {step === 5 && (
              <Step5Done species={selectedSpecies} nickname={nickname} onFinish={handleFinish} finishing={finishing} />
            )}
          </motion.div>
        </AnimatePresence>
      </WizardCard>
    </div>
  )
}
