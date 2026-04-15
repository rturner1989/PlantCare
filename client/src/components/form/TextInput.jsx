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
 * Default className on the wrapper is `block` only — spacing between fields is
 * a layout concern, handled by the parent via `space-y-*` or per-instance
 * `mb-*` on the wrapper className.
 *
 * Pairs with future Textarea / Select / Checkbox primitives in this folder.
 */

const LABEL_TEXT = 'text-xs font-bold text-ink-soft uppercase tracking-wider'
const INPUT_BASE =
  'mt-1 w-full px-4 py-3 rounded-md bg-mint/50 border border-mint text-ink text-sm font-semibold transition-all focus:outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/20'

export default function TextInput({ label, hint, className = '', ...kwargs }) {
  const generatedId = useId()

  return (
    <label className={`block ${className}`}>
      <span className={LABEL_TEXT}>{label}</span>
      <input id={generatedId} className={INPUT_BASE} {...kwargs} />
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}
