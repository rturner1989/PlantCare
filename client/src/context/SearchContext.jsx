import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

// Two contexts to avoid fan-out: actions/scope rarely change (page
// register/unregister, drawer toggle handlers), state changes per
// keystroke. Consumers subscribe only to what they read so a sidebar
// chrome re-render isn't paid for every drawer keystroke.
const SearchActionsContext = createContext(null)
const SearchStateContext = createContext(null)

const DEFAULT_PLACEHOLDER = 'Search…'

export { SearchActionsContext, SearchStateContext }

export function SearchProvider({ children }) {
  const [scope, setScope] = useState(null)
  const [query, setQuery] = useState('')
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const sidebarInputRef = useRef(null)
  const isActive = scope !== null

  useEffect(() => {
    if (!isActive) return
    function handleKey(event) {
      const cmdK = (isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!cmdK) return
      event.preventDefault()
      sidebarInputRef.current?.focus()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isActive])

  const registerScope = useCallback((nextScope) => {
    setScope(nextScope)
    return () => {
      setScope((current) => (current === nextScope ? null : current))
      setQuery('')
      setMobileDrawerOpen(false)
    }
  }, [])

  const clearAll = useCallback(() => {
    setQuery('')
    scope?.onClearAll?.()
  }, [scope])

  const openMobileDrawer = useCallback(() => setMobileDrawerOpen(true), [])
  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(false)
    setQuery('')
  }, [])

  const actionsValue = useMemo(
    () => ({
      isActive,
      placeholder: scope?.placeholder ?? DEFAULT_PLACEHOLDER,
      hasFilterToClear: Boolean(scope?.hasFilterToClear),
      renderResults: scope?.renderResults ?? null,
      setQuery,
      clearAll,
      registerScope,
      openMobileDrawer,
      closeMobileDrawer,
      sidebarInputRef,
    }),
    [isActive, scope, clearAll, registerScope, openMobileDrawer, closeMobileDrawer],
  )

  const stateValue = useMemo(() => ({ query, isMobileDrawerOpen }), [query, isMobileDrawerOpen])

  return (
    <SearchActionsContext.Provider value={actionsValue}>
      <SearchStateContext.Provider value={stateValue}>{children}</SearchStateContext.Provider>
    </SearchActionsContext.Provider>
  )
}
