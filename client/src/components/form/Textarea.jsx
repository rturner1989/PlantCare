import { useId } from 'react'
import FormField, { FIELD_INPUT_BASE, FIELD_INPUT_INVALID, FIELD_INPUT_VALID } from './FormField'

export default function Textarea({
  label,
  labelHidden = false,
  hint,
  error,
  required = false,
  rows = 3,
  className = '',
  ...kwargs
}) {
  const fieldId = useId()
  const errorId = useId()
  const hintId = useId()
  const hasError = Boolean(error)
  const describedBy = hasError ? errorId : hint ? hintId : undefined

  return (
    <FormField
      label={label}
      labelHidden={labelHidden}
      required={required}
      hint={hint}
      hintId={hintId}
      error={error}
      errorId={errorId}
      className={className}
    >
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        className={`${FIELD_INPUT_BASE} resize-y ${hasError ? FIELD_INPUT_INVALID : FIELD_INPUT_VALID}`}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={describedBy}
        {...kwargs}
      />
    </FormField>
  )
}
