export default function SunshineEm({ children, className = '' }) {
  return (
    <em
      className={`font-display italic bg-clip-text text-transparent bg-[image:var(--gradient-sunshine)] ${className}`}
    >
      {children}
    </em>
  )
}
