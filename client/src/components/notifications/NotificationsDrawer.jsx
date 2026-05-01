import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMarkNotificationRead, useNotifications, useNotificationsSeen } from '../../hooks/useNotifications'
import { useNotificationsContext } from '../../hooks/useNotificationsContext'
import Action from '../ui/Action'
import Drawer from '../ui/Drawer'
import EmptyState from '../ui/EmptyState'
import Heading from '../ui/Heading'
import NotificationItem from './NotificationItem'

const MAIN_VIEW_CAP = 5

const GROUPS = [
  {
    key: 'care',
    label: 'Care',
    icon: '💧',
    iconClass: 'bg-sky/20 text-sky-deep',
    kinds: new Set(['care_due_water', 'care_due_feed']),
  },
  {
    key: 'milestone',
    label: 'Milestone',
    icon: '🏆',
    iconClass: 'bg-sunshine/20 text-sunshine-deep',
    kinds: new Set(['milestone']),
  },
]

const FALLBACK_GROUP = {
  key: 'system',
  label: 'System',
  icon: '✨',
  iconClass: 'bg-mint text-emerald',
}

function groupNotifications(notifications) {
  const buckets = new Map()
  for (const notification of notifications) {
    const group = GROUPS.find((candidate) => candidate.kinds.has(notification.kind)) ?? FALLBACK_GROUP
    if (!buckets.has(group.key)) buckets.set(group.key, { group, items: [] })
    buckets.get(group.key).items.push(notification)
  }
  return Array.from(buckets.values())
}

// Start of the current calendar week (Monday 00:00 local). Tally reads
// "M this week" so a rolling 7-day cutoff would be misleading on
// Mondays — user expects the count to reset, not roll back six days.
function startOfWeekMs() {
  const now = new Date()
  const day = now.getDay()
  const offsetToMonday = day === 0 ? 6 : day - 1
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(now.getDate() - offsetToMonday)
  return start.getTime()
}

function weekCount(notifications) {
  const cutoff = startOfWeekMs()
  return notifications.filter((notification) => new Date(notification.created_at).getTime() >= cutoff).length
}

function GroupCard({ group, items, onViewAll, onClose, capped }) {
  const groupUnread = items.filter((item) => !item.read_at).length
  const visibleItems = capped ? items.slice(0, MAIN_VIEW_CAP) : items
  const hiddenCount = items.length - visibleItems.length

  return (
    <section className="rounded-md bg-paper border border-paper-edge/50">
      <header className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <Heading as="h3" variant="card" className="text-ink flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] ${group.iconClass}`}
          >
            {group.icon}
          </span>
          {group.label}
        </Heading>
        {groupUnread > 0 && (
          <span className="px-1.5 py-px rounded-full bg-coral text-paper text-[9px] font-extrabold tracking-[0.06em]">
            {groupUnread} NEW
          </span>
        )}
      </header>
      <ul className="px-2 pb-2 flex flex-col gap-0.5">
        {visibleItems.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} onClose={onClose} />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <div className="px-4 pb-3 pt-1">
          <Action
            variant="unstyled"
            onClick={onViewAll}
            className="text-emerald text-xs font-bold underline decoration-dotted"
          >
            View all ({items.length})
          </Action>
        </div>
      )}
    </section>
  )
}

export default function NotificationsDrawer() {
  const { open, closeDrawer } = useNotificationsContext()
  const { data, isLoading } = useNotifications()
  const markSeen = useNotificationsSeen()
  const markRead = useMarkNotificationRead()
  const [viewKey, setViewKey] = useState(null)
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }

  // useMutation rebuilds its return object on every render but the
  // underlying mutate function is stable. Cache it in a ref so the
  // open-effect's dep array can be a primitive and the mark-seen call
  // only fires when open flips to true.
  const markSeenRef = useRef(markSeen.mutate)
  markSeenRef.current = markSeen.mutate

  useEffect(() => {
    if (!open) {
      setViewKey(null)
      return
    }
    markSeenRef.current()
  }, [open])

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unread_count ?? 0
  const grouped = groupNotifications(notifications)
  const week = weekCount(notifications)
  const expandedGroup = viewKey ? grouped.find((entry) => entry.group.key === viewKey) : null

  function handleMarkAllRead() {
    for (const notification of notifications) {
      if (!notification.read_at) markRead.mutate(notification.id)
    }
  }

  return (
    <Drawer open={open} onClose={closeDrawer} title="Notifications">
      <header className="flex items-center justify-between gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {expandedGroup && (
            <Action
              variant="unstyled"
              onClick={() => setViewKey(null)}
              aria-label="Back to all notifications"
              className="w-7 h-7 rounded-full bg-ink/[0.08] text-ink-soft hover:text-ink hover:bg-ink/[0.12] transition-colors flex items-center justify-center shrink-0"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
            </Action>
          )}
          <Heading as="h2" variant="panel">
            {expandedGroup ? expandedGroup.group.label : 'Notifications'}
          </Heading>
        </div>
        <Action
          variant="unstyled"
          onClick={closeDrawer}
          aria-label="Close notifications"
          className="w-7 h-7 rounded-full bg-ink/[0.08] text-ink-soft hover:text-ink hover:bg-ink/[0.12] transition-colors flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
        </Action>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={expandedGroup ? `group:${expandedGroup.group.key}` : 'index'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="flex-1 flex flex-col min-h-0"
        >
          {!expandedGroup && (
            <div className="flex items-center justify-between px-4 pb-2.5 text-[11px] font-semibold text-ink-softer shrink-0">
              <span>
                {unreadCount} unread · {week} this week
              </span>
              {unreadCount > 0 && (
                <Action
                  variant="unstyled"
                  onClick={handleMarkAllRead}
                  className="text-emerald font-bold underline decoration-dotted"
                >
                  Mark all as read
                </Action>
              )}
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-3">
            {isLoading ? (
              <p className="px-3 py-6 text-sm text-ink-softer">Loading…</p>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={<span aria-hidden="true">🌿</span>}
                title="You're all caught up"
                description="New notifications land here when plants need you or milestones arrive."
                headingLevel="h3"
                className="py-10"
              />
            ) : expandedGroup ? (
              <GroupCard group={expandedGroup.group} items={expandedGroup.items} capped={false} onClose={closeDrawer} />
            ) : (
              grouped.map(({ group, items }) => (
                <GroupCard
                  key={group.key}
                  group={group}
                  items={items}
                  capped
                  onViewAll={() => setViewKey(group.key)}
                  onClose={closeDrawer}
                />
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </Drawer>
  )
}
