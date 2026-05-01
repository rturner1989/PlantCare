import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { cableConsumer, disconnectCable } from '../api/cable'
import { useAuth } from '../hooks/useAuth'

export const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!user) return

    const consumer = cableConsumer()
    const subscription = consumer.subscriptions.create('NotificationsChannel', {
      received: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    })

    return () => {
      subscription.unsubscribe()
      disconnectCable()
    }
  }, [user, queryClient])

  const value = useMemo(() => ({ open, openDrawer, closeDrawer }), [open, openDrawer, closeDrawer])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
