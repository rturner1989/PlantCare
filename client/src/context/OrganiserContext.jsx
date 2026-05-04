import { createContext, useCallback, useMemo, useState } from 'react'

export const OrganiserContext = createContext(null)

export function OrganiserProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ open, openDrawer, closeDrawer }), [open, openDrawer, closeDrawer])

  return <OrganiserContext.Provider value={value}>{children}</OrganiserContext.Provider>
}
