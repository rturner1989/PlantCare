import {
  faChevronLeft,
  faClock,
  faEllipsisVertical,
  faLocationDot,
  faPenToSquare,
  faSeedling,
  faStethoscope,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SegmentedControl from '../components/form/SegmentedControl'
import { PLANT_ACTION_SPOKES } from '../components/plants/ActionWheel'
import PlantAvatar from '../components/plants/Avatar'
import CareRingsRow from '../components/plants/CareRingsRow'
import CareView from '../components/plants/CareView'
import JournalView from '../components/plants/JournalView'
import SpeciesView from '../components/plants/SpeciesView'
import ActionIcon from '../components/ui/ActionIcon'
import Badge from '../components/ui/Badge'
import Breadcrumb from '../components/ui/Breadcrumb'
import EmptyState from '../components/ui/EmptyState'
import Heading from '../components/ui/Heading'
import Menu from '../components/ui/Menu'
import Quote from '../components/ui/Quote'
import RadialWheel from '../components/ui/RadialWheel'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useLogCare, usePlant } from '../hooks/usePlants'
import { getPlantHeroQuote } from '../personality/heroQuotes'
import { pluralize } from '../utils/pluralize'

function ageLabel(plant) {
  const anchor = plant.acquired_at ?? plant.created_at
  if (!anchor) return null
  const days = Math.floor((Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60 * 24))
  if (days < 7) return `${pluralize(days || 1, 'day')} with you`
  if (days < 60) {
    const weeks = Math.floor(days / 7)
    return `${pluralize(weeks, 'week')} with you`
  }
  const months = Math.floor(days / 30)
  return `${pluralize(months, 'month')} with you`
}

function primaryActionFor(plant) {
  if (plant.water_status === 'overdue') return 'water'
  if (plant.feed_status === 'overdue') return 'feed'
  if (plant.water_status === 'due_today') return 'water'
  if (plant.feed_status === 'due_today') return 'feed'
  return null
}

export default function Plant() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: plant, isLoading, error } = usePlant(id)
  const logCare = useLogCare(plant?.id)
  const [view, setView] = useState('care')
  const [stuck, setStuck] = useState(false)
  const sentinelRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()

  function handleViewChange(next) {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50dvh]">
        <Spinner />
      </div>
    )
  }

  if (error || !plant) {
    return (
      <EmptyState
        icon={<span>🌿</span>}
        title="Plant not found"
        description="This plant may have been removed, or the link is wrong."
        headingLevel="h1"
      />
    )
  }

  const isUrgent = plant.water_status === 'overdue' || plant.feed_status === 'overdue'
  const primary = primaryActionFor(plant)
  const spokes = PLANT_ACTION_SPOKES.map((spoke) => ({ ...spoke, primary: spoke.id === primary }))

  function handleSpoke(spokeId) {
    if (spokeId === 'water') {
      logCare.mutate({ care_type: 'watering' })
      toast.success(`Watered ${plant.nickname} 💧`)
      return
    }
    if (spokeId === 'feed') {
      logCare.mutate({ care_type: 'feeding' })
      toast.success(`Fed ${plant.nickname} 🌱`)
      return
    }
    if (spokeId === 'photo') {
      navigate(`/plants/${plant.id}/photos/new`)
      return
    }
    if (spokeId === 'doctor') {
      toast.info('Plant Doctor coming soon')
    }
  }

  const menuActions = [
    { id: 'edit', label: 'Edit plant', icon: faPenToSquare, message: 'Edit plant coming soon' },
    { id: 'log', label: 'Log care', icon: faSeedling, message: 'Manual log coming soon' },
    { id: 'doctor', label: 'Plant Doctor', icon: faStethoscope, message: 'Plant Doctor coming soon' },
    { id: 'delete', label: 'Delete plant', icon: faTrashCan, variant: 'danger', message: 'Delete coming soon' },
  ]

  const ageText = ageLabel(plant)
  const personalityQuote = plant.species?.personality ? getPlantHeroQuote(plant.species.personality, plant.id) : null

  const stickyTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.33, 1, 0.68, 1] }

  const overflowMenu = (
    <Menu label="Plant actions">
      <Menu.Trigger icon={faEllipsisVertical} />
      <Menu.Items>
        {menuActions.map((action) => (
          <Menu.Item
            key={action.id}
            icon={action.icon}
            variant={action.variant}
            onClick={() => toast.info(action.message)}
          >
            {action.label}
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  )

  return (
    <div className="flex flex-col gap-6 lg:gap-8 px-3 lg:px-6 py-4 lg:py-6 overflow-x-hidden">
      <motion.aside
        aria-label={`${plant.nickname} context bar`}
        aria-hidden={!stuck}
        // `inert` keeps focus + SR cursor out when the bar is translated
        // off-screen — `aria-hidden` alone doesn't block Tab order.
        inert={!stuck ? '' : undefined}
        initial={false}
        animate={{ y: stuck ? 0 : -56, opacity: stuck ? 1 : 0 }}
        transition={stickyTransition}
        className="fixed inset-x-0 top-0 z-30 bg-paper/95 backdrop-blur-sm border-b border-paper-edge px-3 lg:px-6 py-2 flex items-center gap-3"
      >
        <ActionIcon icon={faChevronLeft} label="Back" onClick={() => navigate(-1)} scheme="neutral" size="sm" />
        <span className="font-display italic text-base text-ink truncate flex-1">{plant.nickname}</span>
        {overflowMenu}
      </motion.aside>

      <div className="flex items-center justify-between gap-3">
        <Breadcrumb
          items={[
            { label: 'House', to: '/house' },
            plant.space?.name && {
              label: plant.space.name,
              to: `/house?view=list&space_id=${plant.space.id}`,
            },
            { label: plant.nickname },
          ].filter(Boolean)}
        />
        {overflowMenu}
      </div>

      <header className="flex flex-col items-center lg:flex-row lg:items-center lg:justify-center lg:gap-10 gap-4">
        <div className="shrink-0">
          <RadialWheel
            size="lg"
            showOrbit
            urgent={isUrgent}
            spokes={spokes}
            onSpoke={handleSpoke}
            open
            onOpenChange={() => {}}
            centreLabel={plant.nickname}
            centreSlot={
              <span
                className={`relative w-[170px] h-[170px] rounded-full plant-portrait-glass ${
                  isUrgent ? 'plant-portrait-urgent' : ''
                } flex items-center justify-center`}
              >
                <span className="relative z-[2]">
                  <PlantAvatar species={plant.species} size="3xl" shape="circle" />
                </span>
              </span>
            }
          />
        </div>

        <div className="flex flex-col items-center lg:items-start gap-2 text-center lg:text-left max-w-md">
          {personalityQuote && (
            <Quote scheme="coral" size="lg">
              {personalityQuote}
            </Quote>
          )}
          <Heading as="h1" variant="display-lg" className="text-ink">
            {plant.nickname}
          </Heading>
          {plant.species?.scientific_name && (
            <p className="font-display italic text-sm text-ink-soft">{plant.species.scientific_name}</p>
          )}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {plant.space?.name && (
              <Badge scheme="emerald" size="sm" icon={<FontAwesomeIcon icon={faLocationDot} className="w-2 h-2" />}>
                {plant.space.name}
              </Badge>
            )}
            {ageText && (
              <Badge scheme="sunshine" size="sm" icon={<FontAwesomeIcon icon={faClock} className="w-2 h-2" />}>
                {ageText}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div ref={sentinelRef} aria-hidden="true" className="h-px -mt-4" />

      <CareRingsRow plant={plant} />

      <div className="self-start">
        <SegmentedControl
          label="Plant view"
          labelHidden
          value={view}
          onChange={handleViewChange}
          options={[
            { value: 'care', label: 'Care', icon: '💧' },
            { value: 'species', label: 'Species', icon: '🌿' },
            { value: 'journal', label: 'Journal', icon: '📖' },
          ]}
        />
      </div>

      {view === 'care' && <CareView plant={plant} />}
      {view === 'species' && <SpeciesView plant={plant} />}
      {view === 'journal' && <JournalView plant={plant} />}
    </div>
  )
}
