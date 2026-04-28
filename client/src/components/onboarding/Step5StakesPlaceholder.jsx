import Card from '../ui/Card'
import Heading from '../ui/Heading'
import WizardActions from './WizardActions'

export default function Step5StakesPlaceholder({ onBack, onContinue }) {
  function handleSubmit(event) {
    event.preventDefault()
    onContinue()
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <Card.Header divider={false} className="pb-0">
        <Heading variant="display" className="text-ink">
          Stakes
        </Heading>
      </Card.Header>

      <Card.Body>
        <p className="text-sm text-ink-soft leading-relaxed">
          Streak + vitality preview lands in the next PR. Skip ahead for now.
        </p>
      </Card.Body>

      <WizardActions onBack={onBack} />
    </form>
  )
}
