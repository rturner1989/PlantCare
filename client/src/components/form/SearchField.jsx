import { useEffect, useId, useState } from 'react'
import TextInput from './TextInput'

/**
 * Implements the W3C ARIA "combobox with listbox popup, selection follows
 * focus" pattern: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * Focus stays on the input at all times — options are highlighted via
 * `aria-activedescendant` rather than receiving DOM focus. The
 * `onMouseDown preventDefault` on options is what preserves that
 * invariant for mouse users.
 *
 * Popup is "open" iff `results.length > 0`; the consumer drives open/close
 * by controlling when the results array is populated.
 *
 * Keyboard: ArrowUp/Down wrap, Home/End jump, Enter selects the active
 * option, Escape clears it, Tab behaves normally.
 */

const RESULTS_CONTAINER = 'mt-3 space-y-2 max-h-48 overflow-y-auto'
const OPTION_BASE = 'block w-full text-left bg-card border border-mint rounded-md cursor-pointer transition-colors'
const OPTION_ACTIVE = 'border-leaf bg-leaf/5'
const OPTION_INACTIVE = 'hover:border-leaf/50'

export default function SearchField({
  label,
  placeholder,
  query,
  onQueryChange,
  results,
  onSelect,
  getOptionKey,
  renderOption,
  resultsLabel,
  className = '',
}) {
  const listboxId = useId()
  const optionIdBase = useId()
  const [activeIndex, setActiveIndex] = useState(-1)

  // React's "reset state on prop change" pattern — compare during render
  // and reset inline — avoids the double-render an effect would cause and
  // ensures activeIndex never outlives the results array it pointed into.
  const [prevResults, setPrevResults] = useState(results)
  if (results !== prevResults) {
    setPrevResults(results)
    setActiveIndex(-1)
  }

  const hasResults = results.length > 0
  const activeIsValid = activeIndex >= 0 && activeIndex < results.length
  const activeDescendantId = activeIsValid ? `${optionIdBase}-${activeIndex}` : undefined

  // Optional chaining on scrollIntoView because jsdom doesn't implement it;
  // the effect becomes a no-op in unit tests.
  useEffect(() => {
    if (!activeIsValid) return
    const el = document.getElementById(`${optionIdBase}-${activeIndex}`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, activeIsValid, optionIdBase])

  function handleKeyDown(e) {
    if (!hasResults) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(results.length - 1)
    } else if (e.key === 'Enter' && activeIsValid) {
      e.preventDefault()
      onSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setActiveIndex(-1)
    }
  }

  return (
    <div className={className}>
      <TextInput
        label={label}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={hasResults}
        aria-controls={hasResults ? listboxId : undefined}
        aria-activedescendant={activeDescendantId}
        aria-autocomplete="list"
      />

      {hasResults && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={resultsLabel ?? `${label} results`}
          className={RESULTS_CONTAINER}
        >
          {results.map((item, index) => {
            const active = index === activeIndex
            return (
              <button
                key={getOptionKey(item)}
                id={`${optionIdBase}-${index}`}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelect(item)}
                onMouseMove={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                className={`${OPTION_BASE} ${active ? OPTION_ACTIVE : OPTION_INACTIVE}`}
              >
                {renderOption(item)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
