import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import Action from './Action'
import Card from './Card'
import Heading from './Heading'

const MotionCard = motion.create(Card)

// Two-phase view-all choreography:
// 1. View-all button swooshes out (180ms left-slide + fade)
// 2. Once exit-complete fires, parent triggers the real expand
//    (re-render with expanded=true)
// 3. On collapse, view-all is gated by a 600ms re-entry timer so the
//    card move + sibling cards re-enter visibly before the affordance
//    pops back in.
//
// Consumer-owned: per-item stagger inside `children`. The card's
// layout transition runs for ~400ms (200ms delay + 200ms duration);
// stagger your item reveals with `delay: 0.4 + ...` if you want them
// to land after the card finishes moving.

const SECTION_TRANSITION = {
  duration: 0.2,
  ease: 'easeOut',
  layout: { duration: 0.2, ease: 'easeOut', delay: 0.2 },
}

const VIEW_ALL_ENTER = { opacity: 1, height: 'auto', x: 0, transition: { duration: 0.2, ease: 'easeOut' } }
const VIEW_ALL_EXIT = { opacity: 0, x: -120, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } }

export default function DialogCard({
  icon,
  label,
  headingVariant = 'card',
  badge,
  viewAll,
  expanded = false,
  bodyClassName = '',
  className = '',
  children,
}) {
  const showViewAllSlot = Boolean(viewAll) && !expanded

  const [viewAllLeaving, setViewAllLeaving] = useState(false)
  const [viewAllReady, setViewAllReady] = useState(showViewAllSlot)
  const showViewAll = viewAllReady && !viewAllLeaving

  useEffect(() => {
    if (showViewAllSlot) {
      setViewAllLeaving(false)
      const handle = setTimeout(() => setViewAllReady(true), 600)
      return () => clearTimeout(handle)
    }
    setViewAllReady(false)
  }, [showViewAllSlot])

  function handleViewAllClick() {
    setViewAllLeaving(true)
  }

  function handleViewAllExitComplete() {
    if (viewAllLeaving) {
      viewAll?.onClick()
      setViewAllLeaving(false)
    }
  }

  return (
    <MotionCard
      variant="paper-warm"
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SECTION_TRANSITION}
      className={`${expanded ? 'flex-1 min-h-0 overflow-hidden' : ''} ${className}`}
    >
      <Card.Header divider={false} className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
        <Heading as="h3" variant={headingVariant} className="text-ink flex items-center gap-2">
          {icon}
          {label}
        </Heading>
        {badge}
      </Card.Header>
      <Card.Body className={`px-2 pb-2 ${expanded ? '' : '!overflow-visible'} ${bodyClassName}`}>{children}</Card.Body>
      <Card.Footer divider={false}>
        <AnimatePresence initial={false} onExitComplete={handleViewAllExitComplete}>
          {showViewAll && (
            <motion.div
              key="view-all"
              initial={{ opacity: 0, height: 0 }}
              animate={VIEW_ALL_ENTER}
              exit={VIEW_ALL_EXIT}
              className="overflow-hidden px-4 pb-3 pt-1"
            >
              <Action
                variant="unstyled"
                onClick={handleViewAllClick}
                disabled={expanded || viewAllLeaving}
                aria-expanded={expanded}
                className="text-emerald text-xs font-bold underline decoration-dotted"
              >
                View all ({viewAll.count})
              </Action>
            </motion.div>
          )}
        </AnimatePresence>
      </Card.Footer>
    </MotionCard>
  )
}
