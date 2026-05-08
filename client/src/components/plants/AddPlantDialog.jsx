import { useAddPlant } from '../../hooks/useAddPlant'
import Dialog from '../ui/Dialog'

// Step 1 of TICKET-047: bare shell. Future steps land species pick +
// details (space + nickname + schedule preview) in subsequent commits
// on this branch.
export default function AddPlantDialog() {
  const { isOpen, close } = useAddPlant()

  return (
    <Dialog open={isOpen} onClose={close} title="Add a plant">
      <div className="flex flex-col gap-4">
        <p className="text-lg font-extrabold text-ink pr-10">Add a plant</p>
        <p className="text-sm text-ink-soft leading-snug">
          Coming together — species pick + details land in the next steps of this ticket.
        </p>
      </div>
    </Dialog>
  )
}
