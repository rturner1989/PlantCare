import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useId } from 'react'
import { pluralize } from '../../../utils/pluralize'
import { formatSpaceName, getSpaceEmoji } from '../../../utils/spaceIcons'
import Action from '../../ui/Action'

export default function Accordion({ space, weatherToday, isOpen, onToggle, children }) {
  const bodyId = useId()
  const isOutdoor = space.category === 'outdoor'

  return (
    <div>
      <Action
        variant="unstyled"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 sm:px-[18px] py-3 bg-paper-deep border-t border-paper-edge font-display italic text-[17px] text-ink text-left cursor-pointer hover:bg-paper-edge/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald/60"
      >
        <FontAwesomeIcon
          icon={faChevronRight}
          aria-hidden="true"
          className={`shrink-0 w-2.5 h-2.5 text-ink-softer transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
        />
        <span
          aria-hidden="true"
          className="shrink-0 w-6 h-6 rounded-full bg-mint text-emerald flex items-center justify-center text-xs not-italic font-sans"
        >
          {getSpaceEmoji(space.icon)}
        </span>
        <span className="truncate">{formatSpaceName(space.name)}</span>
        {isOutdoor && weatherToday && <WeatherBadge weather={weatherToday} />}
        <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.08em] text-ink-softer not-italic font-sans">
          {pluralize(space.plants_count ?? 0, 'plant')}
        </span>
      </Action>

      <div
        id={bodyId}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

function WeatherBadge({ weather }) {
  return (
    <span className="inline-flex items-center gap-1 pl-0.5 pr-2.5 py-0.5 rounded-full text-[10px] font-bold not-italic font-sans bg-sky text-sky-deep ring-1 ring-inset ring-sky-deep/20">
      <span
        aria-hidden="true"
        className="w-4 h-4 rounded-full bg-sky-deep text-paper flex items-center justify-center text-[9px]"
      >
        {weather.icon ?? '☀'}
      </span>
      <span className="truncate max-w-[120px]">{weather.label}</span>
    </span>
  )
}
