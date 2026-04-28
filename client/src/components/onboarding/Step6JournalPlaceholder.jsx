import Card from '../ui/Card'
import Heading from '../ui/Heading'
import WizardActions from './WizardActions'

export default function Step6JournalPlaceholder({ onBack, onContinue }) {
  function handleSubmit(event) {
    event.preventDefault()
    onContinue()
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <Card.Header divider={false} className="pb-0">
        <Heading variant="display" className="text-ink">
          Journal
        </Heading>
      </Card.Header>

      <Card.Body>
        <p className="text-sm text-ink-soft leading-relaxed">
          System events + journal seed land in the next PR. Skip ahead for now.
        </p>
      </Card.Body>

      <WizardActions onBack={onBack} />
    </form>
  )
}
