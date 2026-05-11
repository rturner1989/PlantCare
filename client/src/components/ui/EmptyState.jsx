/**
 * EmptyState — placeholder for "nothing here" regions across the app.
 *
 * Two variants:
 *   - card (default): full card chrome — paper bg, warm shadow, 140px
 *     tone-coloured illustration disc, Fraunces display title, decorative
 *     mint blob. Matches mockup 28.
 *   - inline: no card chrome, smaller disc + title. For tight spaces
 *     already inside a Card (Plant Detail's Recent care panel, drawer
 *     bodies). No nested-card visuals.
 *
 * Tones drive the illustration disc colour: mint (positive/default),
 * forest (success/streak — only tone with light text), sunshine
 * (additive/CTA-heavy), coral (warning/discovery), sky (search).
 *
 * Title is ReactNode — wrap a word in <em> for the gradient-display
 * emphasis from the mockup (variant=card only; inline keeps plain text).
 *
 *   <EmptyState
 *     tone="sunshine"
 *     title={<>No spaces, no plants — <em>yet</em></>}
 *     description="Plants need a home. Add your first space, then your first plant."
 *     actions={[
 *       <Action variant="primary" to="/add-plant">Add a plant</Action>,
 *       <Action variant="secondary" onClick={openSpaceDialog}>Add a space</Action>,
 *     ]}
 *   />
 */
const DISC_TONE_CLASS = {
  mint: 'bg-[linear-gradient(135deg,var(--color-paper),var(--color-mint))] text-emerald',
  forest:
    'bg-[linear-gradient(135deg,#1a5e2a_0%,#0b3a1a_50%,#124626_100%)] text-paper shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_16px_36px_rgba(80,56,18,0.12)]',
  sunshine: 'bg-[linear-gradient(135deg,var(--color-paper),#ffe5aa)] text-ink',
  coral: 'bg-[linear-gradient(135deg,var(--color-paper),#ffd8c6)] text-coral-deep',
  sky: 'bg-[linear-gradient(135deg,var(--color-paper),var(--color-sky))] text-frost-deep',
}

const DISC_BASE_CARD =
  'relative w-[140px] h-[140px] rounded-full flex items-center justify-center text-[62px] shadow-[inset_0_0_0_1px_var(--color-paper-edge),0_16px_36px_rgba(80,56,18,0.12)] overflow-hidden after:absolute after:inset-0 after:rounded-full after:bg-[radial-gradient(circle_at_30%_20%,rgba(255,240,200,0.4),transparent_55%)]'

const DISC_BASE_INLINE =
  'w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-[var(--shadow-warm-sm)]'

export default function EmptyState({
  variant = 'card',
  tone = 'mint',
  icon,
  title,
  description,
  hint,
  actions,
  action,
  headingLevel = 'h2',
  className = '',
}) {
  const Heading = headingLevel
  const toneClass = DISC_TONE_CLASS[tone] ?? DISC_TONE_CLASS.mint
  // `actions` is the modern prop (array or single ReactNode); `action`
  // remains as a single-node alias so older consumers still render.
  const renderedActions = actions ?? action
  const actionList = Array.isArray(renderedActions)
    ? renderedActions.filter(Boolean)
    : renderedActions
      ? [renderedActions]
      : []

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        {icon && <div className={`${DISC_BASE_INLINE} ${toneClass} mb-4`}>{icon}</div>}
        {title && <Heading className="text-lg font-extrabold text-ink">{title}</Heading>}
        {description && (
          <p className={`text-sm text-ink-soft leading-snug max-w-xs ${title ? 'mt-1' : ''}`}>{description}</p>
        )}
        {hint && <p className="mt-2 text-xs italic text-ink-softer">{hint}</p>}
        {actionList.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">{actionList}</div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative w-full flex-1 flex flex-col items-center justify-center text-center gap-3.5 bg-paper rounded-md shadow-[var(--shadow-warm-md)] px-10 py-12 min-h-[380px] overflow-hidden empty-card-blob ${className}`}
    >
      <div className="relative flex flex-col items-center gap-3.5">
        {icon && <div className={`${DISC_BASE_CARD} ${toneClass} mb-1`}>{icon}</div>}
        {title && (
          <Heading className="font-display italic font-normal text-3xl leading-[1.05] tracking-tight text-ink max-w-md">
            {title}
          </Heading>
        )}
        {description && <p className="text-sm text-ink-soft leading-relaxed font-medium max-w-sm">{description}</p>}
        {hint && <p className="text-xs italic text-ink-softer">{hint}</p>}
        {actionList.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2.5">{actionList}</div>
        )}
      </div>
    </div>
  )
}
