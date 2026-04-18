/**
 * PlantAvatar — small display tile representing a plant.
 *
 * MVP uses a personality-keyed emoji over a mint square; Phase 3 will
 * swap this for a richer illustration system (per spec §3.1). Keeping
 * the API to `species` + `size` means the call sites don't change when
 * the implementation upgrades.
 *
 * When `species` is missing or has no personality, falls back to a
 * generic sprout — safer than rendering nothing for a brand-new plant
 * whose species data hasn't loaded yet.
 *
 * The emoji is hidden from assistive tech (`aria-hidden`) because the
 * adjacent plant name is always the accessible label in every place
 * this component is used (TaskRow, HeroCard, PlantDetail header).
 *
 *   <PlantAvatar species={plant.species} size={48} />
 */

// Keyed to the five personalities on Species.personality (see UI spec
// §12.1). The TICKET-009 work will move this table next to the rest of
// the personality config; keeping it inline for MVP.
const PERSONALITY_EMOJI = {
  dramatic: '🌿',
  prickly: '🌵',
  chill: '🪴',
  needy: '🌸',
  stoic: '🌲',
}

export default function PlantAvatar({ species, size = 48 }) {
  const emoji = PERSONALITY_EMOJI[species?.personality] ?? '🌱'

  return (
    <div
      className="flex items-center justify-center bg-mint rounded-xl shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {emoji}
    </div>
  )
}
