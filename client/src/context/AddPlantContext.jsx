import { createContext, useCallback, useMemo, useState } from 'react'

const AddPlantContext = createContext(null)

export default AddPlantContext

export function AddPlantProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, defaultSpaceId: null })

  const open = useCallback((opts = {}) => {
    setState({ isOpen: true, defaultSpaceId: opts.defaultSpaceId ?? null })
  }, [])

  const close = useCallback(() => {
    setState({ isOpen: false, defaultSpaceId: null })
  }, [])

  const value = useMemo(
    () => ({
      isOpen: state.isOpen,
      defaultSpaceId: state.defaultSpaceId,
      open,
      close,
    }),
    [state, open, close],
  )

  return <AddPlantContext.Provider value={value}>{children}</AddPlantContext.Provider>
}
