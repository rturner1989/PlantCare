import Card from '../ui/Card'
import SpeciesPicker from './SpeciesPicker'

export default function StepSpecies({ onPick }) {
  return (
    <Card.Body className="flex flex-col gap-4">
      <SpeciesPicker onPick={onPick} actionLabel="pick" autoFocus />
    </Card.Body>
  )
}
