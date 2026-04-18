import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { getRoomIcon } from '../utils/roomIcons'
import Action from './ui/Action'
import Badge from './ui/Badge'

/**
 * RoomCard — tile in the House grid.
 *
 * Shows the room icon, name, plant count, and an attention badge
 * ("N thirsty") when `attentionCount > 0`. The whole tile is clickable
 * via Action so keyboard focus, focus ring, and button semantics come
 * for free; the caller wires `onClick` to route to the room's detail
 * page (or filter the list view, etc.).
 *
 *   <RoomCard room={room} attentionCount={2} onClick={() => navigate(`/rooms/${room.id}`)} />
 *
 * A missing/unknown `room.icon` renders no icon tile — safer than a
 * broken glyph when the backend adds a new slug ahead of the client.
 */
export default function RoomCard({ room, attentionCount = 0, onClick }) {
  const hasAttention = attentionCount > 0
  const icon = getRoomIcon(room.icon)

  return (
    <Action
      variant="unstyled"
      onClick={onClick}
      className={`p-4 rounded-xl bg-card border text-left min-h-[130px] flex flex-col justify-between transition-colors hover:border-leaf/50 ${
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
        <p className="text-[15px] font-extrabold text-ink">{room.name}</p>
        <p className="text-[11px] font-semibold text-ink-soft">
          {room.plants_count} {room.plants_count === 1 ? 'plant' : 'plants'}
        </p>
      </div>
    </Action>
  )
}
