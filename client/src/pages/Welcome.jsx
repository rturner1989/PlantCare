import { useEffect, useState } from 'react'
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

const STEP_BY_SLUG = { '': 1, rooms: 2, species: 3, environment: 4, done: 5 }
const SLUG_BY_STEP = { 1: '', 2: 'rooms', 3: 'species', 4: 'environment', 5: 'done' }
const TOTAL_STEPS = Object.keys(STEP_BY_SLUG).length

function stepPath(step) {
  const slug = SLUG_BY_STEP[step]
  return slug ? `/welcome/${slug}` : '/welcome'
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

  const { data: existingRooms, isFetching: roomsFetching } = useRooms({ enabled: !user?.onboarded })

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
      </WizardCard>
    </div>
  )
}
