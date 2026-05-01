import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useMarkNotificationRead, useNotifications, useNotificationsSeen } from '../../hooks/useNotifications'
import { useNotificationsContext } from '../../hooks/useNotificationsContext'
import Action from '../ui/Action'
import Card from '../ui/Card'
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
  const hasHiddenInCapped = items.length > MAIN_VIEW_CAP
  // Cap total stagger time so a 25-item expand doesn't take 1.5s. With
  // many items the per-item gap shrinks; with few it stays generous.
  const hiddenItemCount = Math.max(items.length - MAIN_VIEW_CAP, 0)
  const itemStaggerGap = hiddenItemCount > 0 ? Math.min(0.06, 0.5 / hiddenItemCount) : 0.06
  // Two-phase expand: view-all swooshes out first, then the parent
  // expand kicks off. Decoupling these lets the eye land on the
  // disappearing button before the sibling exits + card moves.
  const [viewAllLeaving, setViewAllLeaving] = useState(false)
  // viewAllReady gates re-entry on collapse. On Back, the view-all
  // waits for siblings + card to settle before fading back in — so the
  // user sees the chrome restore before the affordance reappears.
  const [viewAllReady, setViewAllReady] = useState(capped && hasHiddenInCapped)
  const showViewAll = viewAllReady && !viewAllLeaving

  useEffect(() => {
    if (capped) {
      setViewAllLeaving(false)
      if (!hasHiddenInCapped) {
        setViewAllReady(false)
        return
      }
      const handle = setTimeout(() => setViewAllReady(true), 600)
      return () => clearTimeout(handle)
    }
    setViewAllReady(false)
  }, [capped, hasHiddenInCapped])

  function handleViewAllClick() {
    setViewAllLeaving(true)
  }

  function handleViewAllExitComplete() {
    if (viewAllLeaving) {
      onViewAll()
      setViewAllLeaving(false)
    }
  }

  return (
    <motion.section
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', layout: { duration: 0.2, ease: 'easeOut', delay: 0.2 } }}
      className={`rounded-md overflow-hidden bg-paper border border-paper-edge/50 ${
        capped ? '' : 'flex-1 min-h-0 flex flex-col'
      }`}
    >
      <Card.Header divider={false} className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
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
          <>
            <span className="sr-only">{groupUnread} unread</span>
            <span
              aria-hidden="true"
              className="px-1.5 py-px rounded-full bg-coral text-paper text-[9px] font-extrabold tracking-[0.06em]"
            >
              {groupUnread} NEW
            </span>
          </>
        )}
      </Card.Header>
      <Card.Body className={`px-2 pb-2 ${capped ? 'overflow-visible' : ''}`}>
        <ul className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {visibleItems.map((notification, index) => {
              const isNewlyRevealed = index >= MAIN_VIEW_CAP
              return (
                <motion.li
                  key={notification.id}
                  initial={isNewlyRevealed ? { opacity: 0, y: 8 } : false}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.18,
                      ease: 'easeOut',
                      delay: 0.4 + (index - MAIN_VIEW_CAP) * itemStaggerGap,
                    },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.12, ease: 'easeOut' },
                  }}
                >
                  <NotificationItem notification={notification} onClose={onClose} />
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </Card.Body>
      <AnimatePresence initial={false} onExitComplete={handleViewAllExitComplete}>
        {showViewAll && (
          <motion.div
            key="view-all"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto', x: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ opacity: 0, x: -120, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } }}
            className="overflow-hidden"
          >
            <Card.Footer divider={false} className="px-4 pb-3 pt-1">
              <Action
                variant="unstyled"
                onClick={handleViewAllClick}
                disabled={!capped || viewAllLeaving}
                aria-expanded={!capped}
                className="text-emerald text-xs font-bold underline decoration-dotted"
              >
                View all ({items.length})
              </Action>
            </Card.Footer>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export default function NotificationsDrawer() {
  const { open, closeDrawer } = useNotificationsContext()
  const { data, isLoading } = useNotifications()
  const markSeen = useNotificationsSeen()
  const markRead = useMarkNotificationRead()
  const [viewKey, setViewKey] = useState(null)
  // Header swap lags the body — title + back-arrow change once items
  // have settled, so the eye finishes on the body content rather than
  // the chrome. Reverts immediately on collapse so back-press feels
  // responsive.
  const [headerKey, setHeaderKey] = useState(null)
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }

  useEffect(() => {
    if (!viewKey) {
      setHeaderKey(null)
      return
    }
    const handle = setTimeout(() => setHeaderKey(viewKey), 800)
    return () => clearTimeout(handle)
  }, [viewKey])

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
  const headerGroup = headerKey ? grouped.find((entry) => entry.group.key === headerKey) : null

  function handleMarkAllRead() {
    for (const notification of notifications) {
      if (!notification.read_at) markRead.mutate(notification.id)
    }
  }

  return (
    <Drawer open={open} onClose={closeDrawer} title="Notifications">
      <header className="flex items-center justify-between gap-2 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AnimatePresence initial={false}>
            {headerGroup && (
              <motion.div
                key="back"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={transition}
                className="overflow-hidden"
              >
                <Action
                  variant="unstyled"
                  onClick={() => setViewKey(null)}
                  aria-label="Back to all notifications"
                  className="w-7 h-7 rounded-full bg-ink/[0.08] text-ink-soft hover:text-ink hover:bg-ink/[0.12] transition-colors flex items-center justify-center shrink-0"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
                </Action>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={headerGroup ? headerGroup.group.key : 'index'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
            >
              <Heading as="h2" variant="panel">
                {headerGroup ? headerGroup.group.label : 'Notifications'}
              </Heading>
            </motion.div>
          </AnimatePresence>
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

      <p aria-live="polite" className="sr-only">
        {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
      </p>

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

      <div
        className={`flex-1 min-h-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col gap-3 ${
          expandedGroup ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
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
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {(expandedGroup ? [expandedGroup] : grouped).map(({ group, items }) => (
              <GroupCard
                key={group.key}
                group={group}
                items={items}
                capped={!expandedGroup}
                onViewAll={() => setViewKey(group.key)}
                onClose={closeDrawer}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </Drawer>
  )
}
