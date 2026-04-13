import { Link } from 'react-router-dom'

const SIZES = {
  sm: { mark: 'w-8 h-8 text-sm rounded', word: 'text-base' },
  md: { mark: 'w-[38px] h-[38px] text-lg rounded-md', word: 'text-lg' },
  lg: { mark: 'w-12 h-12 text-2xl rounded-lg', word: 'text-2xl' },
}

export default function Logo({ size = 'md', markOnly = false, className = '', to }) {
  const { mark: markClasses, word: wordClasses } = SIZES[size]
  const baseClasses = `flex items-center gap-2 ${className}`

  const children = (
    <>
      <div
        className={`${markClasses} flex items-center justify-center text-white font-extrabold bg-[image:var(--gradient-brand)]`}
      >
        P
      </div>
      {!markOnly && <span className={`${wordClasses} font-extrabold text-ink`}>PlantCare</span>}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} no-underline`}>
        {children}
      </Link>
    )
  }

  return <div className={baseClasses}>{children}</div>
}
