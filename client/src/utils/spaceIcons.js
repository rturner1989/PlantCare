import { faBath, faBed, faBriefcase, faCouch, faUtensils } from '@fortawesome/free-solid-svg-icons'

/**
 * Maps the backend's `space.icon` string (see `Space::ICONS` on the Rails
 * side — couch/kitchen/bed/bath/desk) to the FontAwesome definition used
 * in the UI. Any unknown value — including null/undefined — resolves to
 * `undefined`, which consumers treat as "no tile". Safer than crashing
 * if the backend adds a new icon slug before the matching glyph ships.
 *
 * Consumers: `Step2Spaces` (onboarding picker), `SpaceCard` (House grid).
 *
 *   import { getSpaceIcon } from '../../utils/spaceIcons'
 *   const icon = getSpaceIcon(space.icon)
 */

const SPACE_ICONS = {
  couch: faCouch,
  kitchen: faUtensils,
  bed: faBed,
  bath: faBath,
  desk: faBriefcase,
}

export function getSpaceIcon(slug) {
  return SPACE_ICONS[slug]
}
