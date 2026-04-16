const BAR_BASE = 'flex-1 h-[5px] rounded-full transition-colors duration-300'
const BAR_PENDING = 'bg-mint'
const BAR_DONE = 'bg-leaf'
const BAR_ACTIVE = 'bg-leaf shadow-[0_0_0_3px_rgba(50,196,86,0.2)]'

export default function StepProgress({ step, total }) {
  // role="presentation" because the "Step N of total" text label that
  // WizardCard renders below these bars is the accessible announcement;
  // the bars themselves are decorative.
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
