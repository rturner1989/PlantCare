import Card, { CardHeader } from '../ui/Card'
import StepProgress from './StepProgress'

// The wizard is deliberately non-dismissible — the dashboard needs at
// least one room to render anything useful, so progress through the
// flow is the only exit.
//
// Sizing: on desktop we lock the card to an exact `sm:h-[640px]` — not
// `sm:min-h-[*]` — so every step renders inside the same rectangle.
// With a min-height, short steps (1, 5) were shorter than tall ones
// (2 with many custom rooms, 3 with results + selected card), which
// made the step transitions look jumpy. Content that exceeds the fixed
// height scrolls inside CardBody's own overflow-y-auto region.
//
// On mobile we stay `flex-1 min-h-0` inside the h-dvh parent, which
// already pins the card to the viewport so every step is the same
// size without a hard-coded pixel height that fights screen variety.
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
