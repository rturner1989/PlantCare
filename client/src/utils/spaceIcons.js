const SPACE_EMOJI = {
  couch: '🛋️',
  kitchen: '🍽️',
  bed: '🛏️',
  bath: '🛁',
  desk: '🪑',
  hallway: '🚪',
  study: '📚',
  conservatory: '🪴',
  patio: '🌳',
  balcony: '🌇',
  garden_bed: '🌱',
  greenhouse: '🌿',
}

const SPACE_LABELS = {
  couch: 'Living room',
  kitchen: 'Kitchen',
  bed: 'Bedroom',
  bath: 'Bathroom',
  desk: 'Office',
  hallway: 'Hallway',
  study: 'Study',
  conservatory: 'Conservatory',
  patio: 'Patio',
  balcony: 'Balcony',
  garden_bed: 'Garden',
  greenhouse: 'Greenhouse',
}

export const SPACE_ICON_OPTIONS = Object.keys(SPACE_EMOJI).map((slug) => ({
  slug,
  emoji: SPACE_EMOJI[slug],
  label: SPACE_LABELS[slug],
}))

export function getSpaceEmoji(slug) {
  return SPACE_EMOJI[slug]
}

export function formatSpaceName(name) {
  if (!name) return name
  return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}
