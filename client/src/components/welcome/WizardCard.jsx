import Card, { CardHeader } from '../ui/Card'
import StepProgress from './StepProgress'

// Fixed `sm:h-[640px]` (not min-h) so every step renders inside the same
// rectangle — otherwise tall steps made transitions look jumpy. Overflow
// scrolls inside CardBody's own overflow-y-auto region.
const WIZARD_SURFACE =
  'flex-1 min-h-0 sm:flex-none sm:h-[640px] flex flex-col w-full max-w-sm sm:max-w-md mx-auto mt-2 rounded-[28px] border-white/80 shadow-[0_20px_50px_rgba(11,58,26,0.14),0_4px_12px_rgba(11,58,26,0.06)]'

export default function WizardCard({ step, total, children }) {
  return (
    <Card className={WIZARD_SURFACE}>
      <CardHeader className="border-b-0">
        <StepProgress step={step} total={total} />
        <p className="mt-3 text-[10px] font-extrabold text-emerald uppercase tracking-wider">
          {step === total ? 'All set!' : `Step ${step} of ${total}`}
        </p>
      </CardHeader>

      {children}
    </Card>
  )
}
