import { useEffect, useRef } from 'react'

const MEDALLION_TEXT = { 404: '404', 500: '!' }

const MEDALLION_TONE = {
  404: 'bg-[var(--gradient-paper)] text-ink shadow-[0_24px_48px_-8px_rgba(80,56,18,0.2),inset_0_0_0_1px_var(--color-paper-edge)]',
  500: 'bg-[linear-gradient(135deg,#ffd8c6,#ff7a4d)] text-paper shadow-[var(--shadow-cta-danger)]',
}

export default function ErrorState({
  scheme = '404',
  title,
  description,
  actions,
  headingLevel = 'h1',
  className = '',
}) {
  const Heading = headingLevel
  const actionsRef = useRef(null)

  // Focus the primary recovery action (first focusable in the actions
  // row) on mount so keyboard users can Enter to escape immediately.
  // Query rather than ref-forwarding so consumers can pass any element
  // (Action, plain button, Link) without ceremony.
  useEffect(() => {
    if (!actionsRef.current) return
    const frame = requestAnimationFrame(() => {
      const focusable = actionsRef.current?.querySelector('a, button, [tabindex]:not([tabindex="-1"])')
      focusable?.focus?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const actionList = Array.isArray(actions) ? actions.filter(Boolean) : actions ? [actions] : []
  const medallionToneClass = MEDALLION_TONE[scheme] ?? MEDALLION_TONE[404]

  return (
    <div
      className={`relative flex flex-col flex-1 items-center justify-center text-center px-6 py-12 gap-4 empty-card-blob ${className}`}
    >
      <div className="relative flex flex-col items-center gap-3.5 max-w-lg">
        <div
          className={`w-[140px] h-[140px] rounded-full flex items-center justify-center font-display italic text-[52px] tracking-tight overflow-hidden relative after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_30%_20%,rgba(255,240,200,0.4),transparent_55%)] ${medallionToneClass}`}
          aria-hidden="true"
        >
          <em className={scheme === '404' ? 'text-gradient-display relative z-10' : 'relative z-10 not-italic'}>
            {MEDALLION_TEXT[scheme] ?? MEDALLION_TEXT[404]}
          </em>
        </div>

        {title && (
          <Heading className="font-display italic font-normal text-4xl leading-[1.05] tracking-tight text-ink">
            {title}
          </Heading>
        )}

        {description && <p className="text-base text-ink-soft leading-relaxed font-medium max-w-md">{description}</p>}

        {actionList.length > 0 && (
          <div ref={actionsRef} className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
            {actionList}
          </div>
        )}
      </div>
    </div>
  )
}
