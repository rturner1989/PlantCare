import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../api/client'
import Step1Intro from '../components/welcome/Step1Intro'
import Step2Rooms from '../components/welcome/Step2Rooms'
import Step3Species from '../components/welcome/Step3Species'
import Step4Environment from '../components/welcome/Step4Environment'
import Step5Done from '../components/welcome/Step5Done'
import WizardCard from '../components/welcome/WizardCard'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'

const TOTAL_STEPS = 5

export default function Welcome() {
  const [step, setStep] = useState(1)
  const [createdRooms, setCreatedRooms] = useState([])
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [nickname, setNickname] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [finishing, setFinishing] = useState(false)

  const navigate = useNavigate()
  const { user, markOnboarded } = useAuth()
  const toast = useToast()

  // Resume support: if the user got partway through onboarding in a
  // previous session and has rooms already, skip Step 2 — re-running it
  // would POST duplicate rooms. We only need this query for un-onboarded
  // users (onboarded users get redirected away below).
  const { data: existingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiGet('/api/v1/rooms'),
    enabled: !user?.onboarded,
  })

  // Already-onboarded users have no business on /welcome. Could happen via
  // a stale PWA shortcut, browser back button, or someone typing the URL.
  // Bounce them home before we render anything.
  useEffect(() => {
    if (user?.onboarded) {
      navigate('/', { replace: true })
    }
  }, [user?.onboarded, navigate])

  // Once the rooms query lands, advance past Step 2 if the user already
  // has rooms. This MUST be a one-shot: using a ref guard instead of a
  // `step === 1` check, because the latter would re-fire every time the
  // user clicks Back down to Step 1, yanking them forward to Step 3 again
  // and making it impossible to navigate back past Step 2.
  const hasResumedRef = useRef(false)
  useEffect(() => {
    if (hasResumedRef.current || existingRooms === undefined) return
    hasResumedRef.current = true
    if (existingRooms.length > 0) {
      setCreatedRooms(existingRooms)
      setStep(3)
    }
  }, [existingRooms])

  function handleRoomsCreated(rooms) {
    setCreatedRooms(rooms)
    setStep(3)
  }

  function handleSpeciesChosen(species, chosenNickname, chosenRoomId) {
    setSelectedSpecies(species)
    setNickname(chosenNickname)
    setRoomId(chosenRoomId)
    setStep(species ? 4 : 5)
  }

  // Persist the "I finished onboarding" flag server-side before sending the
  // user to the dashboard. Without this, the next session would route them
  // back here via the ProtectedRoute gate. If the request fails, we keep
  // the user on Step 5 so they can retry — silently navigating would leave
  // them in an inconsistent state.
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
    <div className="flex flex-col min-h-dvh px-5 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:justify-center">
      <WizardCard step={step} total={TOTAL_STEPS}>
        {step === 1 && <Step1Intro onNext={() => setStep(2)} />}
        {step === 2 && (
          <Step2Rooms initialRooms={createdRooms} onBack={() => setStep(1)} onComplete={handleRoomsCreated} />
        )}
        {step === 3 && (
          <Step3Species
            availableRooms={createdRooms}
            initialSpecies={selectedSpecies}
            initialNickname={nickname}
            initialRoomId={roomId}
            onBack={() => setStep(2)}
            onComplete={handleSpeciesChosen}
          />
        )}
        {step === 4 && (
          <Step4Environment
            species={selectedSpecies}
            nickname={nickname}
            roomId={roomId}
            onBack={() => setStep(3)}
            onComplete={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <Step5Done species={selectedSpecies} nickname={nickname} onFinish={handleFinish} finishing={finishing} />
        )}
      </WizardCard>
    </div>
  )
}
