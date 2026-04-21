import { getPersonalityEmoji } from '../personality/emoji'
import Avatar from './ui/Avatar'

/**
 * PlantAvatar — small display tile representing a plant.
 *
 * Composes the generic `Avatar` primitive with plant-domain knowledge:
 * the `src` is `species.image_url`, the fallback is a personality-keyed
 * emoji (dramatic 🌿, prickly 🌵, chill 🪴…), and missing/unknown species
 * fall through to a generic sprout 🌱.
 *
 * Purely decorative — the accessible name always lives on the adjacent
 * plant nickname in every call site, so this tile stays `aria-hidden`.
 *
 *   <PlantAvatar species={plant.species} size={48} />
 *   <PlantAvatar species={plant.species} shape="circle" className="border-2 border-card" />
 */
export default function PlantAvatar({ species, size = 48, shape = 'tile', className = '', ...kwargs }) {
  const emoji = getPersonalityEmoji(species?.personality)

  return (
    <Avatar
      src={species?.image_url}
      fallback={<span>{emoji}</span>}
      size={size}
      shape={shape}
      className={className}
      aria-hidden="true"
      {...kwargs}
    />
  )
}
