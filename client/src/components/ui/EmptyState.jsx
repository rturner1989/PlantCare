/**
 * EmptyState — placeholder for "no data" regions across the app: empty
 * search results, an empty Today list, a House with no plants, a plant
 * with no care history, etc.
 *
 * Slots are all optional so the component scales from a single sentence
 * (search no-results: just `description`) up to a full empty-state card
 * (icon + title + description + CTA).
 *
 * Outer spacing is the caller's job — wrap in `<div className="py-8">` or
 * pass extra padding via `className`. The component centers its own slots
 * but doesn't reserve vertical space, so it works inside flex-grow regions
 * (search results) and inside fixed cards (dashboard placeholders) alike.
 *
 * `headingLevel` lets the caller place the title at the right spot in the
 * document outline. Default `h2` suits use inside a page that already has
 * an `h1`; pass `h1` when the empty state is the page's primary content
 * (e.g. a whole Today page showing "All caught up!" with no other heading).
 *
 *   <EmptyState
 *     icon={<FontAwesomeIcon icon={faLeaf} />}
 *     title="No plants yet"
 *     description="Add your first plant to get started."
 *     action={<Action to="/add-plant" variant="primary">Add a plant</Action>}
 *   />
 */
export default function EmptyState({ icon, title, description, action, headingLevel = 'h2', className = '' }) {
  const Heading = headingLevel

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-mint flex items-center justify-center text-emerald text-xl mb-3">
          {icon}
        </div>
      )}
      {title && <Heading className="text-base font-extrabold text-ink">{title}</Heading>}
      {description && (
        <p className={`text-sm text-ink-soft leading-snug max-w-xs ${title ? 'mt-1' : ''}`}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
