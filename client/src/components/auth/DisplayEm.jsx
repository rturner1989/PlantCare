export default function DisplayEm({ children, className = '' }) {
  return (
    <em className={`font-display italic bg-clip-text text-transparent bg-[image:var(--gradient-display)] ${className}`}>
      {children}
    </em>
  )
}
