import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { pluralize } from '../utils/pluralize'
import { getSpaceIcon } from '../utils/spaceIcons'
import Action from './ui/Action'
import Badge from './ui/Badge'

/**
 * SpaceCard — tile in the House grid.
 *
 * Shows the space icon, name, plant count, and an attention badge
 * ("N thirsty") when `attentionCount > 0`. The whole tile is clickable
 * via Action so keyboard focus, focus ring, and button semantics come
 * for free; the caller wires `onClick` to route to the space's detail
 * page (or filter the list view, etc.).
 *
 *   <SpaceCard space={space} attentionCount={2} onClick={() => navigate(`/spaces/${space.id}`)} />
 *
 * A missing/unknown `space.icon` renders no icon tile — safer than a
 * broken glyph when the backend adds a new slug ahead of the client.
 */
export default function SpaceCard({ space, attentionCount = 0, onClick }) {
  const hasAttention = attentionCount > 0
  const icon = getSpaceIcon(space.icon)

  return (
    <Action
      variant="unstyled"
      onClick={onClick}
      className={`p-4 rounded-md bg-card border text-left min-h-[130px] flex flex-col justify-between transition-colors hover:border-leaf/50 ${
        hasAttention ? 'border-coral/30' : 'border-mint'
      }`}
    >
      <div className="flex items-start justify-between">
        {icon ? (
          <div className="w-9 h-9 rounded-md bg-mint flex items-center justify-center text-emerald text-sm">
            <FontAwesomeIcon icon={icon} />
          </div>
        ) : (
          <div className="w-9 h-9" />
        )}
        {hasAttention && (
          <Badge scheme="coral" variant="soft">
            {attentionCount} thirsty
          </Badge>
        )}
      </div>

      <div>
        <p className="text-[15px] font-extrabold text-ink">{space.name}</p>
        <p className="text-[11px] font-semibold text-ink-soft">{pluralize(space.plants_count, 'plant')}</p>
      </div>
    </Action>
  )
}
