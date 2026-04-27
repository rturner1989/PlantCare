export default function Divider({ className = '', children }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className="flex-1 h-px bg-paper-edge" />
      {children && <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-ink-softer">{children}</span>}
      <span aria-hidden="true" className="flex-1 h-px bg-paper-edge" />
    </div>
  )
}
