import { useId } from 'react'

/**
 * TextInput — labelled single-line text input primitive.
 *
 * Wraps <input> in an implicit <label> so the whole block is clickable to focus
 * the input. Forwards all standard HTML input props via ...kwargs: type, value,
 * onChange, required, minLength, placeholder, autoComplete, etc.
 *
 * The input is given a stable auto-generated `id` via React's useId() so that
 * browsers' autofill machinery has something to anchor against — without this
 * Chrome/Brave logs a warning "form field element has neither an id nor a name
 * attribute". Consumers can still override by passing `id` or `name` explicitly
 * (kwargs spread wins over our generated id).
 *
 * Error state:
 *
 *   <TextInput label="Email" error={fieldErrors.email} ... />
 *
 * When `error` is a non-empty string the input gains a coral border/focus
 * ring, `aria-invalid="true"`, and the error message renders in the slot
 * below the input (replacing the hint text if both are set). `aria-describedby`
 * points at the error message so assistive tech announces it together with
 * the field label. useFormSubmit's focus-first-invalid logic finds invalid
 * inputs via the aria-invalid attribute.
 *
 * Default className on the wrapper is `block` only — spacing between fields is
 * a layout concern, handled by the parent via `space-y-*` or per-instance
 * `mb-*` on the wrapper className.
 *
 * Pairs with future Textarea / Select / Checkbox primitives in this folder.
 */

const LABEL_TEXT = 'text-xs font-bold text-ink-soft uppercase tracking-wider'
// text-base (16px) specifically — iOS Safari auto-zooms into any input
// below 16px on focus and doesn't zoom back out, which breaks the layout
// of every form-bearing page.
const INPUT_BASE =
  'mt-1 w-full px-4 py-3 rounded-md bg-mint/50 border text-ink text-base font-semibold transition-all focus:outline-none focus:ring-4'
const INPUT_VALID = 'border-mint focus:border-leaf focus:ring-leaf/20'
const INPUT_INVALID = 'border-coral focus:border-coral focus:ring-coral/20'

export default function TextInput({ label, hint, error, className = '', ...kwargs }) {
  const generatedId = useId()
  const errorId = useId()
  const hasError = Boolean(error)

  return (
    <label className={`block ${className}`}>
      <span className={LABEL_TEXT}>{label}</span>
      <input
        id={generatedId}
        className={`${INPUT_BASE} ${hasError ? INPUT_INVALID : INPUT_VALID}`}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...kwargs}
      />
      {hasError ? (
        <span id={errorId} className="mt-1 block text-xs font-semibold text-coral-deep">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>
      )}
    </label>
  )
}
