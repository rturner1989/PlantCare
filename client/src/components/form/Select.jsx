import { useId } from 'react'
import FormField, { FIELD_INPUT_BASE, FIELD_INPUT_INVALID, FIELD_INPUT_VALID } from './FormField'

export default function Select({
  label,
  labelHidden = false,
  hint,
  error,
  required = false,
  className = '',
  children,
  ...kwargs
}) {
  const inputId = useId()
  const errorId = useId()
  const hasError = Boolean(error)

  return (
    <FormField
      label={label}
      labelHidden={labelHidden}
      required={required}
      hint={hint}
      error={error}
      errorId={errorId}
      className={className}
    >
      <select
        id={inputId}
        required={required}
        className={`${FIELD_INPUT_BASE} ${hasError ? FIELD_INPUT_INVALID : FIELD_INPUT_VALID}`}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...kwargs}
      >
        {children}
      </select>
    </FormField>
  )
}
