import Avatar from './ui/Avatar'

const FALLBACK_EMOJI = '🌱'

export default function PlantAvatar({ species, size = 'md', shape = 'tile', className = '', ...kwargs }) {
  return (
    <Avatar
      src={species?.image_url}
      fallback={<span>{FALLBACK_EMOJI}</span>}
      size={size}
      shape={shape}
      className={className}
      aria-hidden="true"
      {...kwargs}
    />
  )
}
