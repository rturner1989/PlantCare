import Card, { CardBody, CardHeader } from '../ui/Card'
import StepProgress from './StepProgress'

/**
 * WizardCard — the white, floating card that wraps each onboarding step.
 *
 * Composes the shared `<Card>` primitive the same way Login/Register do —
 * `<Card>` owns the outer surface, `<CardHeader>` owns the top region,
 * `<CardBody>` owns the content area. That way every elevated-card
 * screen in the app rides on the same three building blocks instead of
 * reinventing padding and dividers per page.
 *
 * The wizard is intentionally non-dismissible: users can't bail out
 * partway because the app's dashboard needs at least a room to render
 * anything meaningful. Progress through the flow is the only exit.
 * The final "done" step swaps the "Step N of total" label for "All set!"
 * to signal completion.
 *
 * Overrides passed to Card:
 * - `rounded-[28px]` matches the mockup's 28px radius (Card defaults to
 *   rounded-lg which is 18px).
 * - `border-white/80` gives the subtle highlight border from the mockup
 *   (Card defaults to border-mint).
 * - Layered shadow baked into the class list for the floating effect.
 * - `flex-1 sm:flex-none flex flex-col` + width constraints so the card
 *   fills the viewport on mobile but collapses to content height on
 *   wider viewports where the outer container then centers it.
 */

// On mobile the card fills the screen vertically (flex-1) so the wizard
// feels like a native modal. On sm+ it collapses to content height and the
// outer container centers it — otherwise it stretches into "a phone
// viewport rendered inside a browser", which looks wrong on desktop.
const WIZARD_SURFACE =
  'flex-1 sm:flex-none flex flex-col w-full max-w-sm sm:max-w-md mx-auto mt-2 rounded-[28px] border-white/80 shadow-[0_20px_50px_rgba(11,58,26,0.14),0_4px_12px_rgba(11,58,26,0.06)]'

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
