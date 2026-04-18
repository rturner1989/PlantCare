import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import Spinner from '../ui/Spinner'
import TextInput from './TextInput'

// W3C ARIA combobox with listbox popup, selection follows focus:
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
// Focus stays on the input — `onMouseDown preventDefault` on options keeps it.

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
  // Intentionally not reset on query change — a new query lands at scrollTop 0.
  const didRestoreScrollRef = useRef(false)

  // "Reset state on prop change" pattern — compare during render to avoid the
  // double-render an effect would cause.
  const [prevResults, setPrevResults] = useState(results)
  if (results !== prevResults) {
    setPrevResults(results)
    setActiveIndex(-1)
  }

  const hasResults = results.length > 0
  const activeIsValid = activeIndex >= 0 && activeIndex < results.length
  const activeDescendantId = activeIsValid ? `${optionIdBase}-${activeIndex}` : undefined

  // scrollIntoView is optional-chained because jsdom doesn't implement it.
  useEffect(() => {
    if (!activeIsValid) return
    const el = document.getElementById(`${optionIdBase}-${activeIndex}`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex, activeIsValid, optionIdBase])

  // Restore saved scroll before paint (useLayoutEffect) to avoid a 0 → restored
  // flicker after iOS tab eviction + reload.
  useLayoutEffect(() => {
    if (!storageKey || didRestoreScrollRef.current || !listboxRef.current || !hasResults) return
    const saved = sessionStorage.getItem(`search-scroll:${storageKey}`)
    if (saved !== null) {
      const parsed = Number(saved)
      if (!Number.isNaN(parsed)) listboxRef.current.scrollTop = parsed
    }
    didRestoreScrollRef.current = true
  })

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

      {!hasResults && !loading && query.trim() && renderNoResults && (
        <div className="mt-3 flex-1 min-h-48 flex items-center justify-center text-center px-2">
          {renderNoResults(query)}
        </div>
      )}
    </div>
  )
}
