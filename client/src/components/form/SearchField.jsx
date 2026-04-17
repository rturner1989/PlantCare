import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Spinner from '../ui/Spinner'
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

// `absolute inset-0` lets the listbox fill its `relative` wrapper exactly.
// The wrapper carries the sizing (flex-1 + min-h-48), so the listbox can grow
// to fill remaining vertical space when the parent is a height-constrained
// flex column, and falls back to a sensible minimum elsewhere.
const RESULTS_CONTAINER = 'space-y-2 absolute inset-0 overflow-y-auto'
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
  renderNoResults,
  resultsLabel,
  loading = false,
  className = '',
  storageKey,
}) {
  const listboxId = useId()
  const optionIdBase = useId()
  const [activeIndex, setActiveIndex] = useState(-1)
  const listboxRef = useRef(null)
  // Tracks whether we've already restored scroll for this mount. Starts
  // false on every fresh mount (e.g. after an iOS tab eviction + reload),
  // so the restore runs once as soon as the listbox has results to
  // scroll within. Intentionally NOT reset on query change — new queries
  // land at scrollTop 0 which matches the user's expectation of starting
  // at the top of a different list.
  const didRestoreScrollRef = useRef(false)

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

  // Restore scroll from sessionStorage as soon as the listbox is populated.
  // Guards against iOS tab-eviction-and-reload dumping the user back to
  // the top of the list on return. useLayoutEffect so the restore happens
  // before paint — no flicker from 0 → restored. Runs once per mount via
  // didRestoreScrollRef; subsequent re-renders (refetch, data update) are
  // ignored because the listbox's existing scrollTop is already correct.
  useLayoutEffect(() => {
    if (!storageKey || didRestoreScrollRef.current || !listboxRef.current || !hasResults) return
    const saved = sessionStorage.getItem(`search-scroll:${storageKey}`)
    if (saved !== null) {
      const parsed = Number(saved)
      if (!Number.isNaN(parsed)) listboxRef.current.scrollTop = parsed
    }
    didRestoreScrollRef.current = true
  })

  // Save the current scrollTop on every scroll. sessionStorage writes are
  // synchronous and cheap; no need to debounce for a single numeric value.
  function handleListboxScroll() {
    if (!storageKey || !listboxRef.current) return
    sessionStorage.setItem(`search-scroll:${storageKey}`, String(listboxRef.current.scrollTop))
  }

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
    <div className={`flex flex-col ${className}`}>
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
        <div className="relative mt-3 flex-1 min-h-48">
          <div
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            aria-label={resultsLabel ?? `${label} results`}
            aria-busy={loading ? 'true' : undefined}
            onScroll={handleListboxScroll}
            className={`${RESULTS_CONTAINER} ${loading ? 'opacity-50 pointer-events-none' : ''}`}
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
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Spinner />
            </div>
          )}
        </div>
      )}

      {loading && !hasResults && (
        <div className="mt-3 flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {/* Empty state: shown only after the user has typed something AND a
          fetch has settled with zero matches. Skipped during loading (a
          spinner already covers that), and skipped on initial render so the
          placeholder doesn't appear before the user has searched. */}
      {!hasResults && !loading && query.trim() && renderNoResults && (
        <div className="mt-3 flex-1 min-h-48 flex items-center justify-center text-center px-2">
          {renderNoResults(query)}
        </div>
      )}
    </div>
  )
}
