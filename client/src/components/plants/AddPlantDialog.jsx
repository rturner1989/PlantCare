import { useEffect, useState } from 'react'
import { useAddPlant } from '../../hooks/useAddPlant'
import Card from '../ui/Card'
import Dialog from '../ui/Dialog'
import StepSpecies from './StepSpecies'

const TITLE = 'Add a plant'

export default function AddPlantDialog() {
  const { isOpen, close } = useAddPlant()
  const [pendingSpecies, setPendingSpecies] = useState(null)

  // Reset wizard state every time dialog reopens — stale species from a
  // prior session would otherwise jump us straight to the details step.
  useEffect(() => {
    if (isOpen) setPendingSpecies(null)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onClose={close} title={TITLE}>
      <Card.Header divider={false}>
        <p className="text-lg font-extrabold text-ink">{TITLE}</p>
      </Card.Header>

      {pendingSpecies ? (
        <Card.Body className="flex flex-col gap-4">
          <p className="text-sm text-ink-soft">
            Picked: <strong className="text-ink">{pendingSpecies.common_name}</strong>. Step 3 (details) lands next.
          </p>
        </Card.Body>
      ) : (
        <StepSpecies onPick={setPendingSpecies} />
      )}
    </Dialog>
  )
}
