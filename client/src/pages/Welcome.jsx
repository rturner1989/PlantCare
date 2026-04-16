import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Step1Intro from '../components/welcome/Step1Intro'
import Step2Rooms from '../components/welcome/Step2Rooms'
import Step3Species from '../components/welcome/Step3Species'
import Step4Environment from '../components/welcome/Step4Environment'
import Step5Done from '../components/welcome/Step5Done'
import WizardCard from '../components/welcome/WizardCard'

const TOTAL_STEPS = 5

export default function Welcome() {
  const [step, setStep] = useState(1)
  const [createdRooms, setCreatedRooms] = useState([])
  const [selectedSpecies, setSelectedSpecies] = useState(null)
  const [nickname, setNickname] = useState('')
  const navigate = useNavigate()

  function handleRoomsCreated(rooms) {
    setCreatedRooms(rooms)
    setStep(3)
  }

  function handleSpeciesChosen(species, chosenNickname) {
    setSelectedSpecies(species)
    setNickname(chosenNickname)
    setStep(species ? 4 : 5)
  }

  function handleFinish() {
    localStorage.setItem('plantcare_tour_pending', 'true')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-[calc(env(safe-area-inset-top)+3rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:justify-center">
      <WizardCard step={step} total={TOTAL_STEPS}>
        {step === 1 && <Step1Intro onNext={() => setStep(2)} />}
        {step === 2 && <Step2Rooms onBack={() => setStep(1)} onComplete={handleRoomsCreated} />}
        {step === 3 && <Step3Species onBack={() => setStep(2)} onComplete={handleSpeciesChosen} />}
        {step === 4 && (
          <Step4Environment
            species={selectedSpecies}
            nickname={nickname}
            roomId={createdRooms[0]?.id}
            onBack={() => setStep(3)}
            onComplete={() => setStep(5)}
          />
        )}
        {step === 5 && <Step5Done species={selectedSpecies} nickname={nickname} onFinish={handleFinish} />}
      </WizardCard>
    </div>
  )
}
