import { useEffect, useId, useState } from 'react'
import TextInput from './TextInput'

/**
 * SearchField — a labelled search input paired with an ARIA combobox popup.
 *
 * Implements the "combobox with listbox popup, selection follows focus"
 * authoring pattern from the W3C WAI-ARIA Authoring Practices Guide:
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * **Focus model.** The text input is the only focusable element. Options do
 * not take DOM focus; instead the active option is tracked via
 * `aria-activedescendant` on the input, and highlighted visually. Mouse
 * clicks use `onMouseDown preventDefault` so clicking an option does not
 * steal focus from the input.
 *
 * **Keyboard.** On the input:
 *   ArrowDown — move to next option (wraps)
 *   ArrowUp   — move to previous option (wraps)
 *   Home      — move to first option
 *   End       — move to last option
 *   Enter     — select the active option (if any)
 *   Escape    — clear the active option
 * Tab behaves normally; the popup does not trap focus.
 *
 * **Open/close state.** The popup is "open" iff `results.length > 0`. The
 * parent owns the query state and fetch logic, so *it* decides when results
 * appear (e.g. by returning popular picks for a blank query, search results
 * once the user has typed enough). SearchField doesn't maintain its own
 * open state — the data drives the UI.
 *
 * **Fully controlled.** Consumer owns query/results/selection/fetching.
 *
 * Usage — species search in onboarding:
 *
 *   const [query, setQuery] = useState('')
 *   const deferredQuery = useDeferredValue(query)
 *   const { data: results = [] } = useSpeciesSearch(deferredQuery)
 *
 *   <SearchField
 *     label="Search species"
 *     placeholder="Monstera, Snake Plant..."
 *     query={query}
 *     onQueryChange={setQuery}
 *     results={results}
 *     onSelect={(species) => setSelected(species)}
 *     getOptionKey={(species) => species.id ?? species.common_name}
 *     renderOption={(species) => <SpeciesRow species={species} />}
 *   />
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

  // Reset the active option whenever the results array changes (new fetch,
  // cleared query, etc.) — otherwise activeIndex might point past the end
  // of the new array or at a stale option. This is the "reset state when a
  // prop changes" pattern from the React docs: compare against a stored
  // previous value during render and queue the reset inline, avoiding an
  // effect that would double-render.
  const [prevResults, setPrevResults] = useState(results)
  if (results !== prevResults) {
    setPrevResults(results)
    setActiveIndex(-1)
  }

  const hasResults = results.length > 0
  const activeIsValid = activeIndex >= 0 && activeIndex < results.length
  const activeDescendantId = activeIsValid ? `${optionIdBase}-${activeIndex}` : undefined

  // Keep the active option scrolled into view on keyboard navigation so
  // arrowing past the visible area doesn't leave the user staring at a
  // highlight they can't see. `scrollIntoView` isn't implemented in jsdom
  // so we call it through optional chaining — the effect is a no-op in
  // unit tests, which is fine because there's nothing to scroll there.
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
