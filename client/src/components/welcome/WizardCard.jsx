import Card, { CardBody, CardHeader } from '../ui/Card'
import StepProgress from './StepProgress'

// The wizard is deliberately non-dismissible — the dashboard needs at
// least one room to render anything useful, so progress through the
// flow is the only exit.
// `sm:min-h-[620px]` keeps the card a consistent size across steps on
// desktop; without it Step 1's short intro and Step 2's full room list
// give visibly different heights and the card jitters as you progress.
const WIZARD_SURFACE =
  'flex-1 sm:flex-none sm:min-h-[620px] flex flex-col w-full max-w-sm sm:max-w-md mx-auto mt-2 rounded-[28px] border-white/80 shadow-[0_20px_50px_rgba(11,58,26,0.14),0_4px_12px_rgba(11,58,26,0.06)]'

export default function WizardCard({ step, total, children }) {
  return (
    <Card className={WIZARD_SURFACE}>
      <CardHeader className="border-b-0">
        <StepProgress step={step} total={total} />
        <p className="mt-3 text-[10px] font-extrabold text-emerald uppercase tracking-wider">
          {step === total ? 'All set!' : `Step ${step} of ${total}`}
        </p>
      </CardHeader>

      <CardBody className="flex-1 flex flex-col">{children}</CardBody>
    </Card>
  )
}
