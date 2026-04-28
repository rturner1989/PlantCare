import {
  faBath,
  faBed,
  faBriefcase,
  faBuilding,
  faCity,
  faCouch,
  faMugSaucer,
  faSeedling,
  faShoePrints,
  faSpa,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons'

const SPACE_ICONS = {
  couch: faCouch,
  kitchen: faUtensils,
  bed: faBed,
  bath: faBath,
  desk: faBriefcase,
  hallway: faShoePrints,
  study: faBuilding,
  conservatory: faSpa,
  patio: faMugSaucer,
  balcony: faCity,
  garden_bed: faSeedling,
  greenhouse: faSpa,
}

const SPACE_EMOJI = {
  couch: '🛋️',
  kitchen: '🍳',
  bed: '🛏️',
  bath: '🚿',
  desk: '💻',
  hallway: '🪜',
  study: '📚',
  conservatory: '🪴',
  patio: '☕',
  balcony: '🏙️',
  garden_bed: '🌱',
  greenhouse: '🌿',
}

export function getSpaceIcon(slug) {
  return SPACE_ICONS[slug]
}

export function getSpaceEmoji(slug) {
  return SPACE_EMOJI[slug]
}
