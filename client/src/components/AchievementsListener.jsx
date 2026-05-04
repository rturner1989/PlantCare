import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { cableConsumer } from '../api/cable'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks/useAuth'

// Mounted inside the ToastProvider tree so it can fire toasts on
// achievement broadcasts. Subscribes to AchievementsChannel for the
// authenticated user; cable consumer singleton is shared with
// NotificationsProvider (one underlying connection, two channels).
//
// StrictMode double-invokes effects in dev. The subscription ref
// guards against creating two subscriptions for the same channel —
// any stale subscription is torn down before a new one starts.
export default function AchievementsListener() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const subscriptionRef = useRef(null)

  useEffect(() => {
    if (!user) return

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }

    const consumer = cableConsumer()
    subscriptionRef.current = consumer.subscriptions.create('AchievementsChannel', {
      received: (achievement) => {
        toast.success({
          title: 'Achievement unlocked',
          meta: `${achievement.emoji} ${achievement.label}`,
          duration: 6000,
        })
        queryClient.invalidateQueries({ queryKey: ['achievements'] })
      },
    })

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [user, queryClient, toast])

  return null
}
