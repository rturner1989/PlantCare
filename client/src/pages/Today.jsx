import { useMemo, useRef } from 'react'
import HeroCard from '../components/HeroCard'
import ProgressRing from '../components/ProgressRing'
import TaskRow from '../components/TaskRow'
import Action from '../components/ui/Action'
import Avatar from '../components/ui/Avatar'
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

  const urgentPlant = useMemo(() => {
    const overdue = (data?.plants_needing_water ?? []).filter((plant) => plant.water_status === 'overdue')
    if (!overdue.length) return null

    return overdue.reduce((worst, plant) =>
      (plant.days_until_water ?? 0) < (worst.days_until_water ?? 0) ? plant : worst,
    )
  }, [data])

  const tasks = useMemo(() => {
    if (!data) return []

    const allTasks = []
    for (const plant of data.plants_needing_water ?? []) {
      allTasks.push({ plant, careType: 'watering' })
    }
    for (const plant of data.plants_needing_feeding ?? []) {
      allTasks.push({ plant, careType: 'feeding' })
    }

    // Hero owns the urgent plant's water CTA, so filter its row out of the list —
    // but only when there's something else to interact with. Otherwise the list
    // would vanish entirely for one-plant accounts, leaving the hero as the sole
    // affordance on the page.
    const withoutHero = allTasks.filter((task) => !(task.plant.id === urgentPlant?.id && task.careType === 'watering'))
    const items = withoutHero.length > 0 ? withoutHero : allTasks

    items.sort((a, b) => (STATUS_PRIORITY[taskStatus(a)] ?? 3) - (STATUS_PRIORITY[taskStatus(b)] ?? 3))
    return items
  }, [data, urgentPlant])

  const totalTasks = tasks.length
  // Freeze "rituals at session start" on the first render that has data.
  // Each subsequent completion shrinks totalTasks via dashboard refetch, so
  // doneCount = ritualsAtStart - totalTasks. The ref resets on remount, which
  // is the behaviour we want (fresh session on next Today visit).
  const ritualsAtStartRef = useRef(null)
  if (ritualsAtStartRef.current === null && data) {
    ritualsAtStartRef.current = totalTasks
  }
  const ritualsAtStart = ritualsAtStartRef.current ?? totalTasks
  const doneCount = Math.max(0, ritualsAtStart - totalTasks)
  const progressPercent = ritualsAtStart > 0 ? (doneCount / ritualsAtStart) * 100 : 0

  const attentionCount = (data?.plants_needing_water?.length ?? 0) + (data?.plants_needing_feeding?.length ?? 0)
  const attentionPlants = useMemo(() => {
    const seen = new Set()
    const names = []
    if (urgentPlant) {
      seen.add(urgentPlant.id)
      names.push(urgentPlant.nickname)
    }
    for (const task of tasks) {
      if (seen.has(task.plant.id)) continue
      seen.add(task.plant.id)
      names.push(task.plant.nickname)
    }
    return names
  }, [urgentPlant, tasks])
  const totalPlants = data?.stats?.total_plants ?? 0
  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="px-5 pt-4 lg:px-6 lg:pt-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-ink-soft">
            {getGreeting()} · {formatToday()}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink lg:font-display lg:text-5xl lg:italic lg:font-medium">
            Hi, <span className="text-leaf">{firstName ?? 'there'}</span>
          </h1>
        </div>
        {user && (
          <Action to="/me" variant="unstyled" aria-label="View profile" className="lg:hidden relative shrink-0">
            <Avatar
              src={user.avatar_url}
              fallback={<span className="text-emerald font-bold">{user.name?.[0]?.toUpperCase() ?? '?'}</span>}
              size="lg"
              shape="circle"
            />
            {attentionCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0 right-0 w-3 h-3 rounded-full bg-coral border-2 border-card"
              />
            )}
          </Action>
        )}
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
        <div className="min-h-[50dvh] flex items-center justify-center">
          <div className="bg-card rounded-lg shadow-[var(--shadow-sm)] p-8 w-full max-w-sm">
            <EmptyState
              title="We couldn't load today"
              description="Something went wrong fetching your plants."
              action={
                <Action variant="secondary" onClick={() => refetch()}>
                  Try again
                </Action>
              }
            />
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {urgentPlant && (
            <div className="mb-4">
              <WaterableHeroCard plant={urgentPlant} />
            </div>
          )}

          <div className="mb-6">
            {urgentPlant ? (
              <Banner
                urgent
                title={attentionCount === 1 ? '1 thing needs attention' : `${attentionCount} things need attention`}
                subtitle={attentionPlants.slice(0, 2).join(', ')}
              />
            ) : (
              <Banner
                title="You're on top of things"
                subtitle={totalTasks > 0 ? `${pluralize(totalTasks, 'ritual')} to go` : 'No tasks for today'}
              />
            )}
          </div>

          {totalTasks > 0 && (
            <section className="mb-8 rounded-lg bg-card p-4 shadow-[var(--shadow-sm)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[22px] font-extrabold tracking-tight text-ink">Today's rituals</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-soft">
                    {doneCount > 0 && <strong className="text-leaf">{doneCount} done · </strong>}
                    {totalTasks} to go
                  </span>
                  <ProgressRing value={progressPercent} size={44} strokeWidth={3}>
                    <span className="text-[11px] font-extrabold text-ink">
                      {doneCount}/{ritualsAtStart}
                    </span>
                  </ProgressRing>
                </div>
              </div>

              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li key={`${task.plant.id}-${task.careType}`}>
                    <WaterableTaskRow task={task} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {totalTasks === 0 && !urgentPlant && (
            <div className="min-h-[50dvh] flex items-center justify-center">
              <div className="relative bg-card rounded-lg shadow-[var(--shadow-sm)] p-8 lg:p-12 w-full max-w-sm lg:max-w-md overflow-hidden">
                <span aria-hidden="true" className="absolute -top-2 -right-3 text-5xl opacity-20 rotate-12">
                  🌿
                </span>
                <span aria-hidden="true" className="absolute -bottom-3 -left-2 text-4xl opacity-25 -rotate-12">
                  🪴
                </span>
                {totalPlants > 0 ? (
                  <EmptyState
                    icon={<span>✨</span>}
                    title="All caught up"
                    description="Your plants are thriving. Check back later."
                  />
                ) : (
                  <EmptyState
                    icon={<span>🌱</span>}
                    title="Your jungle starts here"
                    description="Add a plant to see it come alive."
                    action={
                      <Action to="/add-plant" variant="primary">
                        Add a plant
                      </Action>
                    }
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function WaterableHeroCard({ plant }) {
  const logCare = useLogCare(plant.id)

  return <HeroCard plant={plant} onWater={() => logCare.mutate({ care_type: 'watering' })} />
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
