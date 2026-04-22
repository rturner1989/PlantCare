import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import CareConfirmDialog from '../components/CareConfirmDialog'
import HeroCard from '../components/HeroCard'
import ProgressRing from '../components/ProgressRing'
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
    <div className="flex flex-col flex-1 min-h-0 gap-3 lg:gap-4 px-3 lg:px-4 lg:pt-4 lg:pb-4">
      <header className="bg-card rounded-md shadow-[var(--shadow-sm)] p-4">
        <p className="text-[13px] font-semibold text-ink-soft">
          {getGreeting()} · {formatToday()}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink lg:font-display lg:text-5xl lg:italic lg:font-medium">
          Hi, <span className="text-leaf">{firstName ?? 'there'}</span>
        </h1>
      </header>

      <div className="relative flex flex-col flex-1 min-h-0 bg-card rounded-md shadow-[var(--shadow-sm)] overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              aria-label="Loading your plants"
              className="flex-1 flex items-center justify-center"
            >
              <Spinner />
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center">
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
                <section>
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
                    <AnimatePresence initial={false}>
                      {tasks.map((task) => (
                        <motion.li
                          key={`${task.plant.id}-${task.careType}`}
                          layout
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.28, ease: [0.33, 1, 0.68, 1] }}
                        >
                          <WaterableTaskRow task={task} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              )}

              {totalTasks === 0 && !urgentPlant && (
                <div className="relative flex-1 flex items-center justify-center">
                  <span aria-hidden="true" className="absolute -top-4 -right-4 text-7xl opacity-20 rotate-12">
                    🌿
                  </span>
                  <span aria-hidden="true" className="absolute -bottom-4 -left-4 text-6xl opacity-25 -rotate-12">
                    🪴
                  </span>
                  <span aria-hidden="true" className="absolute top-8 left-8 text-4xl opacity-15 rotate-45">
                    🌸
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function WaterableHeroCard({ plant }) {
  const logCare = useLogCare(plant.id)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleConfirm() {
    logCare.mutate({ care_type: 'watering' })
    setConfirmOpen(false)
  }

  return (
    <>
      <HeroCard plant={plant} onWater={() => setConfirmOpen(true)} />
      <CareConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        plant={plant}
        careType="watering"
        submitting={logCare.isPending}
      />
    </>
  )
}

function WaterableTaskRow({ task }) {
  const logCare = useLogCare(task.plant.id)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleConfirm() {
    logCare.mutate({ care_type: task.careType })
    setConfirmOpen(false)
  }

  return (
    <>
      <TaskRow
        plant={task.plant}
        careType={task.careType}
        done={logCare.isSuccess}
        onComplete={() => setConfirmOpen(true)}
      />
      <CareConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        plant={task.plant}
        careType={task.careType}
        submitting={logCare.isPending}
      />
    </>
  )
}
