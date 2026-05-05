import Heading from '../ui/Heading'
import StreakStat from './StreakStat'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatToday() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

export default function TodayHeader({ firstName }) {
  return (
    <header className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <p className="text-[13px] font-semibold text-ink-soft mb-1">
          {getGreeting()} · {formatToday()}
        </p>
        <Heading as="h1" variant="display-lg" className="text-ink">
          Hi, <span className="text-leaf">{firstName ?? 'there'}</span>
        </Heading>
      </div>
      <StreakStat />
    </header>
  )
}
