/**
 * StepProgress — the onboarding wizard's progress header.
 *
 * Renders `total` horizontal pill bars, one per step, with three states:
 *   - done    (bar index < current step)     → solid leaf
 *   - active  (bar index === current step)   → solid leaf + halo glow
 *   - pending (bar index > current step)     → mint
 *
 * The "Step N of total" text label below the bars (rendered by WizardCard)
 * is the accessible announcement — the bars themselves are decorative and
 * marked role="presentation" so screen readers don't double-announce.
 */

const BAR_BASE = 'flex-1 h-[5px] rounded-full transition-colors duration-300'
const BAR_PENDING = 'bg-mint'
const BAR_DONE = 'bg-leaf'
const BAR_ACTIVE = 'bg-leaf shadow-[0_0_0_3px_rgba(50,196,86,0.2)]'

export default function StepProgress({ step, total }) {
  return (
    <div className="flex gap-1.5" role="presentation">
      {Array.from({ length: total }, (_, i) => {
        const position = i + 1
        let state = BAR_PENDING
        if (position < step) state = BAR_DONE
        else if (position === step) state = BAR_ACTIVE
        return <div key={position} className={`${BAR_BASE} ${state}`} />
      })}
    </div>
  )
}
