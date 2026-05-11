import Action from '../Action'

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
