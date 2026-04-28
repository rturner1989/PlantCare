import Card from '../ui/Card'
import Heading from '../ui/Heading'
import WizardActions from './shared/WizardActions'

export default function Step4EnvironmentPlaceholder({ onBack, onContinue }) {
  function handleSubmit(event) {
    event.preventDefault()
    onContinue()
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-4">
      <Card.Header divider={false}>
        <Heading variant="display" className="text-ink">
          Environment
        </Heading>
      </Card.Header>

      <Card.Body>
        <p className="text-sm text-ink-soft leading-relaxed">
          Per-space environment (light / temperature / humidity) lands in the next PR. Skip ahead for now.
        </p>
      </Card.Body>

      <WizardActions onBack={onBack} />
    </form>
  )
}
