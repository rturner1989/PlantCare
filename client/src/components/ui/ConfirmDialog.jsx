import Action from './Action'
import Dialog from './Dialog'

// Styled replacement for window.confirm. Renders a centred Dialog with
// title + message + Cancel/Confirm row. `destructive` swaps the confirm
// button's accent to coral for delete-style flows.
//
// Title styling matches AddCustomSpaceForm — visible <p>, not a heading.
// Dialog's `title` prop already injects an sr-only h2 as the accessible
// name, so the visible text doesn't need to be a heading element.
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) {
  function handleConfirm() {
    onConfirm()
    onClose()
  }

  const confirmClasses = destructive
    ? 'inline-flex items-center justify-center rounded-md gap-2 px-6 py-3 text-sm font-extrabold text-paper bg-coral-deep hover:bg-coral-deep/90 transition-colors active:scale-[0.98]'
    : 'inline-flex items-center justify-center rounded-md gap-2 px-6 py-3 text-sm font-extrabold text-paper bg-emerald hover:bg-forest transition-colors active:scale-[0.98]'

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-lg font-extrabold text-ink pr-10">{title}</p>
        {message && <p className="text-sm text-ink-soft leading-snug">{message}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Action
            variant="unstyled"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md gap-2 px-6 py-3 text-sm font-extrabold text-ink-soft hover:text-ink hover:bg-paper-deep transition-colors"
          >
            {cancelLabel}
          </Action>
          <Action variant="unstyled" onClick={handleConfirm} className={confirmClasses}>
            {confirmLabel}
          </Action>
        </div>
      </div>
    </Dialog>
  )
}
