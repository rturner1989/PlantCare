import { useState } from 'react'

/**
 * Avatar — generic image-with-fallback tile.
 *
 * Shows `src` as a cover-fit image when provided; falls back to the
 * `fallback` node when `src` is missing OR the image fails to load
 * (onError flips the internal errored flag and the fallback renders
 * in place instead of leaving an empty square).
 *
 * `shape="tile"` (default) gives the rounded-square used by PlantAvatar.
 * `shape="circle"` gives the full-round used for user avatars + plant
 * avatar rows. Default background is `bg-mint` — override via className
 * when the palette calls for something different.
 *
 * Purely structural: aria-hidden / role / aria-label are NOT set here,
 * because consumer intent varies (decorative plant tile vs labelled
 * user avatar vs clickable chip). Pass them in via kwargs.
 *
 *   <Avatar src={user.avatar_url} fallback={<span>RT</span>} shape="circle" size={38} />
 */
export default function Avatar({ src, fallback = null, size = 48, shape = 'tile', className = '', ...kwargs }) {
  const [errored, setErrored] = useState(false)
  const showImage = Boolean(src) && !errored
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-xl'

  return (
    <div
      className={`flex items-center justify-center bg-mint overflow-hidden shrink-0 ${radius} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      {...kwargs}
    >
      {showImage ? (
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setErrored(true)} />
      ) : (
        fallback
      )}
    </div>
  )
}
