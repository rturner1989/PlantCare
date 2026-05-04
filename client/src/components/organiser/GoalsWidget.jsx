import DialogCard from '../ui/DialogCard'

const HEADER_ICON = (
  <span
    aria-hidden="true"
    className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] bg-emerald/20 text-emerald"
  >
    ◎
  </span>
)

// Placeholder goals until the goals backend ships. Each goal carries a
// label, target, and current progress count. When real data lands swap
// to a useGoals() hook returning the same shape.
const PLACEHOLDER_GOALS = [
  { id: 'water-streak-30', label: '30-day watering streak', current: 8, target: 30 },
  { id: 'photo-monthly', label: 'Photo every plant this month', current: 3, target: 7 },
  { id: 'no-rescue-week', label: 'Zero rescue alerts this week', current: 4, target: 7 },
]

export default function GoalsWidget() {
  return (
    <DialogCard icon={HEADER_ICON} label="Goals">
      <ul className="flex flex-col gap-2.5 px-2 pb-2">
        {PLACEHOLDER_GOALS.map((goal) => {
          const percent = Math.min(100, Math.round((goal.current / goal.target) * 100))
          return (
            <li key={goal.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-ink truncate">{goal.label}</span>
                <span className="font-bold text-ink-softer shrink-0 text-[10px]">
                  {goal.current}/{goal.target}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-paper-deep overflow-hidden">
                <div
                  className="h-full bg-[image:var(--gradient-brand)]"
                  style={{ width: `${percent}%` }}
                  aria-hidden="true"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </DialogCard>
  )
}
