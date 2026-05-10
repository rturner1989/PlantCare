import { useEffect, useId, useRef } from 'react'
import Action from './Action'
import Card from './Card'
import Dialog from './Dialog'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  confirmDisabled = false,
  loading = false,
  loadingLabel,
  initialFocus,
  initialFocusRef,
}) {
  const titleId = useId()
  const cancelRef = useRef(null)
  const confirmRef = useRef(null)

  // Destructive flows default focus to Cancel (a11y — prevents
  // accidental Enter-deletes). Override via `initialFocus` ('confirm')
  // or `initialFocusRef` (a child input ref, e.g. Delete dialog's
  // type-to-confirm input where typing IS the safety gate).
  const focusTarget = initialFocusRef ? 'custom' : (initialFocus ?? (destructive ? 'cancel' : 'confirm'))

  useEffect(() => {
    if (!open) return
    let node
    if (focusTarget === 'custom') node = initialFocusRef?.current
    else if (focusTarget === 'cancel') node = cancelRef.current
    else node = confirmRef.current
    if (!node) return
    const frame = requestAnimationFrame(() => node.focus())
    return () => cancelAnimationFrame(frame)
  }, [open, focusTarget, initialFocusRef])

  async function handleSubmit(event) {
    event.preventDefault()
    if (confirmDisabled || loading) return
    try {
      const result = onConfirm?.()
      if (result && typeof result.then === 'function') {
        await result
      }
    } catch {
      // Consumer's onConfirm reported the error (toast, log). Stay
      // open so the user can retry. Swallow here so the rejection
      // doesn't surface as an unhandled promise warning.
      return
    }
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} ariaLabelledBy={titleId}>
      <Card.Header divider={false}>
        <p id={titleId} className="text-lg font-extrabold text-ink pr-10">
          {title}
        </p>
      </Card.Header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 gap-4">
        <Card.Body className="!flex-none flex flex-col gap-4">
          {message && <p className="text-sm text-ink-soft leading-snug">{message}</p>}
          {children}
        </Card.Body>

        <Card.Footer divider={false} className="flex justify-end gap-2.5">
          <Action ref={cancelRef} type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Action>
          <Action
            ref={confirmRef}
            type="submit"
            variant={destructive ? 'danger' : 'primary'}
            disabled={confirmDisabled || loading}
          >
            {loading ? (loadingLabel ?? confirmLabel) : confirmLabel}
          </Action>
        </Card.Footer>
      </form>
    </Dialog>
  )
}
