import { useState } from 'react'

/**
 * Avatar — generic image-with-fallback tile.
 *
 * Shows `src` as a cover-fit image when provided; falls back to the
 * `fallback` node when `src` is missing OR the image fails to load
 * (onError flips the internal errored flag and the fallback renders
 * in place instead of leaving an empty square).
 *
 * Sizing + shape are preset keys, not raw pixel values — every avatar
 * in the app picks from a shared scale so tile dimensions stay
 * consistent across screens. `className` is forwarded for borders,
 * shadows, and positioning; extra props flow to the root.
 *
 * No aria handling baked in — consumer intent varies (decorative plant
 * tile vs labelled user avatar vs clickable chip). Pass in via kwargs.
 *
 *   <Avatar src={user.avatar_url} fallback={<span>RT</span>} shape="circle" size="sm" />
 */

const SIZE_CLASSES = {
  sm: 'w-[38px] h-[38px] text-base',
  md: 'w-12 h-12 text-xl',
  lg: 'w-[52px] h-[52px] text-2xl',
  xl: 'w-20 h-20 text-4xl',
}

const SHAPE_CLASSES = {
  tile: 'rounded-xl',
  circle: 'rounded-full',
}

export default function Avatar({ src, fallback = null, size = 'md', shape = 'tile', className = '', ...kwargs }) {
  const [errored, setErrored] = useState(false)
  const showImage = Boolean(src) && !errored

  return (
    <div
      className={`flex items-center justify-center bg-mint overflow-hidden shrink-0 ${SIZE_CLASSES[size]} ${SHAPE_CLASSES[shape]} ${className}`}
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
