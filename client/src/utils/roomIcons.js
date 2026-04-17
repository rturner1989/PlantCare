import { faBath, faBed, faBriefcase, faCouch, faUtensils } from '@fortawesome/free-solid-svg-icons'

/**
 * Maps the backend's `room.icon` string (see `Room::ICONS` on the Rails
 * side — couch/kitchen/bed/bath/desk) to the FontAwesome definition used
 * in the UI. Any unknown value — including null/undefined — resolves to
 * `undefined`, which consumers treat as "no tile". Safer than crashing
 * if the backend adds a new icon slug before the matching glyph ships.
 *
 * Consumers: `Step2Rooms` (onboarding picker), `RoomCard` (House grid).
 *
 *   import { getRoomIcon } from '../../utils/roomIcons'
 *   const icon = getRoomIcon(room.icon)
 */

const ROOM_ICONS = {
  couch: faCouch,
  kitchen: faUtensils,
  bed: faBed,
  bath: faBath,
  desk: faBriefcase,
}

export function getRoomIcon(slug) {
  return ROOM_ICONS[slug]
}
