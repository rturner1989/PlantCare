import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useId } from 'react'
import Action from '../../ui/Action'
import Tooltip from '../../ui/Tooltip'

export default function SearchBar({
  value,
  onChange,
  onClearAll,
  hasFilterToClear = false,
  placeholder = 'Search plants…',
}) {
  const inputId = useId()
  const showClear = Boolean(value) || hasFilterToClear

  function handleClear() {
    if (onClearAll) onClearAll()
    else onChange('')
  }

  return (
    <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3.5 py-2 bg-paper rounded-full border border-paper-edge shadow-warm-sm focus-within:border-emerald focus-within:ring-2 focus-within:ring-inset focus-within:ring-emerald/15 transition-colors">
      <label htmlFor={inputId} className="flex-1 min-w-0 flex items-center gap-2 cursor-text">
        <FontAwesomeIcon icon={faMagnifyingGlass} aria-hidden="true" className="w-3.5 h-3.5 text-ink-softer" />
        <span className="sr-only">Search plants</span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-base font-semibold text-ink placeholder:text-ink-softer placeholder:font-normal"
        />
      </label>
      {showClear && (
        <Action
          variant="unstyled"
          onClick={handleClear}
          aria-label={hasFilterToClear ? 'Clear search and filter' : 'Clear search'}
          className="relative group shrink-0 w-6 h-6 rounded-full text-ink-softer hover:text-ink hover:bg-paper-deep flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
          <Tooltip placement="top">Clear</Tooltip>
        </Action>
      )}
    </div>
  )
}
