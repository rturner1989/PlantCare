import { useId } from 'react'

/**
 * Select — labelled dropdown primitive that mirrors TextInput's label/error
 * shape. Wraps `<select>` in an implicit `<label>` so the whole block is
 * clickable, applies the same focus ring + invalid border treatment, and
 * threads `aria-invalid` / `aria-describedby` for assistive tech.
 *
 * Pass `error` as a string to render the invalid state and the error message;
 * pass falsy to render the optional `hint` instead. Children are the `<option>`
 * elements — typically a leading disabled placeholder + the real options.
 */

const LABEL_TEXT = 'mb-1.5 block text-[10px] font-extrabold text-ink-soft uppercase tracking-[0.14em]'
const SELECT_BASE =
  'w-full px-4 py-2 rounded-md bg-paper border-[1.5px] text-ink text-base font-semibold transition-all focus:outline-none focus:ring-4 focus:ring-inset'
const SELECT_VALID = 'border-paper-edge focus:border-emerald focus:ring-emerald/15'
const SELECT_INVALID = 'border-coral focus:border-coral focus:ring-coral/20'

export default function Select({ label, hint, error, required = false, className = '', children, ...kwargs }) {
  const generatedId = useId()
  const errorId = useId()
  const hasError = Boolean(error)

  return (
    <label className={`block ${className}`}>
      <span className={LABEL_TEXT}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-coral-deep">
            *
          </span>
        )}
      </span>
      <select
        id={generatedId}
        required={required}
        className={`${SELECT_BASE} ${hasError ? SELECT_INVALID : SELECT_VALID}`}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...kwargs}
      >
        {children}
      </select>
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
