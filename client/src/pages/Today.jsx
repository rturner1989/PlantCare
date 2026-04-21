import { useMemo } from 'react'
import HeroCard from '../components/HeroCard'
import TaskRow from '../components/TaskRow'
import Action from '../components/ui/Action'
import Banner from '../components/ui/Banner'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useDashboard } from '../hooks/useDashboard'
import { useLogCare } from '../hooks/usePlants'
import { pluralize } from '../utils/pluralize'

const STATUS_PRIORITY = { overdue: 0, due_today: 1, due_soon: 2 }

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

function taskStatus(task) {
  return task.careType === 'watering' ? task.plant.water_status : task.plant.feed_status
}

export default function Today() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useDashboard()

  const tasks = useMemo(() => {
    if (!data) return []

    const items = []
    for (const plant of data.plants_needing_water ?? []) {
      items.push({ plant, careType: 'watering' })
    }
    for (const plant of data.plants_needing_feeding ?? []) {
      items.push({ plant, careType: 'feeding' })
    }
    items.sort((a, b) => (STATUS_PRIORITY[taskStatus(a)] ?? 3) - (STATUS_PRIORITY[taskStatus(b)] ?? 3))
    return items
  }, [data])

  const urgentPlant = useMemo(() => {
    const overdue = (data?.plants_needing_water ?? []).filter((plant) => plant.water_status === 'overdue')
    if (!overdue.length) return null

    return overdue.reduce((worst, plant) =>
      (plant.days_until_water ?? 0) < (worst.days_until_water ?? 0) ? plant : worst,
    )
  }, [data])

  const thrivingPlant = useMemo(() => {
    if (urgentPlant) return null

    const candidates = (data?.upcoming_care ?? []).filter(
      (plant) => plant.days_until_water != null && plant.days_until_water >= 0,
    )
    if (!candidates.length) return null

    return candidates.reduce((soonest, plant) =>
      (plant.days_until_water ?? Number.POSITIVE_INFINITY) < (soonest.days_until_water ?? Number.POSITIVE_INFINITY)
        ? plant
        : soonest,
    )
  }, [data, urgentPlant])

  const totalTasks = tasks.length
  const hasHero = urgentPlant || thrivingPlant
  const totalPlants = data?.stats?.total_plants ?? 0
  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="px-5 pt-4 lg:px-6 lg:pt-6">
      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-soft">
          {getGreeting()} · {formatToday()}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink lg:font-display lg:text-5xl lg:italic lg:font-medium">
          Hi, <span className="text-leaf">{firstName ?? 'there'}</span>
        </h1>
      </header>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Loading your plants"
          className="flex items-center justify-center py-16"
        >
          <Spinner />
        </div>
      )}

      {error && (
        <EmptyState
          title="We couldn't load today"
          description="Something went wrong fetching your plants."
          action={
            <Action variant="secondary" onClick={() => refetch()}>
              Try again
            </Action>
          }
        />
      )}

      {!isLoading && !error && (
        <>
          {urgentPlant && (
            <div className="mb-4">
              <WaterableHeroCard plant={urgentPlant} />
            </div>
          )}

          {thrivingPlant && !urgentPlant && (
            <div className="mb-4">
              <HeroCard plant={thrivingPlant} variant="thriving" />
            </div>
          )}

          <div className="mb-6">
            {urgentPlant ? (
              <Banner
                urgent
                title={`${pluralize(totalTasks, 'thing')} need attention`}
                subtitle={tasks
                  .slice(0, 2)
                  .map((task) => `${task.plant.nickname} needs ${task.careType === 'watering' ? 'water' : 'feeding'}`)
                  .join(', ')}
              />
            ) : (
              <Banner
                title="You're on top of things"
                subtitle={totalTasks > 0 ? `${pluralize(totalTasks, 'ritual')} to go` : 'No tasks for today'}
              />
            )}
          </div>

          {totalTasks > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-[22px] font-extrabold tracking-tight text-ink">Today's rituals</h2>
                <span className="text-sm font-semibold text-ink-soft">{pluralize(totalTasks, 'ritual')} to go</span>
              </div>

              <ul className="space-y-2 pb-8">
                {tasks.map((task) => (
                  <li key={`${task.plant.id}-${task.careType}`}>
                    <WaterableTaskRow task={task} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {totalTasks === 0 && !hasHero && (
            <EmptyState
              title="No tasks today"
              description={
                totalPlants > 0 ? 'Every plant is happy. Check back later.' : 'Add your first plant to get started.'
              }
            />
          )}
        </>
      )}
    </div>
  )
}

function WaterableHeroCard({ plant }) {
  const logCare = useLogCare(plant.id)

  return <HeroCard plant={plant} variant="urgent" onWater={() => logCare.mutate({ care_type: 'watering' })} />
}

function WaterableTaskRow({ task }) {
  const logCare = useLogCare(task.plant.id)

  return (
    <TaskRow
      plant={task.plant}
      careType={task.careType}
      done={logCare.isSuccess}
      onComplete={() => logCare.mutate({ care_type: task.careType })}
    />
  )
}
