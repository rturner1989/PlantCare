import { faClock, faDroplet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getDaysDisplay } from '../utils/careStatus'
import PlantAvatar from './PlantAvatar'
import Action from './ui/Action'

export default function HeroCard({ plant, variant = 'urgent', onWater }) {
  const isUrgent = variant === 'urgent'
  const daysText = getDaysDisplay(plant.days_until_water)
  const backgroundClass = isUrgent ? 'bg-[image:var(--gradient-forest)]' : 'bg-[image:var(--gradient-brand)]'

  return (
    <div className={`relative rounded-md overflow-hidden px-5 py-5 lg:px-7 lg:py-7 ${backgroundClass}`}>
      {isUrgent && <div className="absolute inset-0 pointer-events-none hero-glow-urgent" aria-hidden="true" />}

      <div className="relative z-10 max-w-[240px]">
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-lime mb-3">
          {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" aria-hidden="true" />}
          {plant.nickname}
        </p>

        <p className="border-l-[3px] border-coral pl-3 text-white font-display text-3xl italic font-medium leading-tight lg:text-5xl">
          {daysText ?? (isUrgent ? 'Overdue' : 'Happy')}
        </p>

        <p className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-white/80">
          {plant.room?.name && <span>{plant.room.name}</span>}
          <span aria-hidden="true">·</span>
          {isUrgent ? (
            <span className="flex items-center gap-1 text-coral">
              <FontAwesomeIcon icon={faClock} className="text-[11px]" aria-hidden="true" />
              Needs water
            </span>
          ) : (
            <span>Next water</span>
          )}
        </p>

        {isUrgent && (
          <Action
            variant="unstyled"
            onClick={onWater}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-lime text-forest font-extrabold text-[13px] active:scale-95 transition-transform"
          >
            <FontAwesomeIcon icon={faDroplet} aria-hidden="true" />
            Water
          </Action>
        )}
      </div>

      <div className="absolute bottom-4 right-4 opacity-85">
        <PlantAvatar species={plant.species} size={80} />
      </div>
    </div>
  )
}
