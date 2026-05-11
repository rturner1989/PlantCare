import Action from '../Action'

/**
 * In-card error placeholder for partial-region failures — passed as the
 * `fallback` of a per-widget ErrorBoundary so one bad widget doesn't
 * blank the surrounding page.
 *
 * Distinct from full-page <ErrorState>: quiet, in-card, no medallion,
 * no headline. Just enough to tell the user this slice failed and
 * give them a retry.
 *
 *   <ErrorBoundary fallback={({ reset }) => <WidgetError onRetry={reset} />}>
 *     <Organiser />
 *   </ErrorBoundary>
 */
export default function WidgetError({ label = "Couldn't load this just now.", onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center gap-2 px-4 py-6 ${className}`}>
      <span aria-hidden="true" className="text-2xl text-coral-deep">
        ⚠
      </span>
      <p className="text-sm text-ink-soft leading-snug">{label}</p>
      {onRetry && (
        <Action variant="secondary" onClick={onRetry} type="button">
          Try again
        </Action>
      )}
    </div>
  )
}
