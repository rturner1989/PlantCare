import { getPersonalityEmoji } from '../personality/emoji'

/**
 * PlantAvatar — small display tile representing a plant.
 *
 * Shows the species image when `species.image_url` is present, else falls
 * back to a personality-keyed emoji (dramatic 🌿, prickly 🌵, chill 🪴…).
 * Missing species → generic sprout. Purely decorative — the accessible
 * name comes from the adjacent plant nickname, so the tile stays
 * `aria-hidden`.
 *
 * `shape="tile"` (default) is the rounded-square used in TaskRow and the
 * hero card fallback. `shape="circle"` is the full-round used for avatar
 * rows (Step 5 collection). `className` is forwarded so consumers can
 * add borders, shadows, or positioning without re-wrapping.
 *
 *   <PlantAvatar species={plant.species} size={48} />
 *   <PlantAvatar species={plant.species} shape="circle" className="border-2 border-card" />
 */
export default function PlantAvatar({ species, size = 48, shape = 'tile', className = '', ...kwargs }) {
  const imageUrl = species?.image_url
  const emoji = getPersonalityEmoji(species?.personality)
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  return (
    <div
      className={`flex items-center justify-center bg-mint overflow-hidden shrink-0 ${radius} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      aria-hidden="true"
      {...kwargs}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span>{emoji}</span>
      )}
    </div>
  )
}
