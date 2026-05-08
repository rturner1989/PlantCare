import { faBars } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ActionIcon from './ActionIcon'

const MenuContext = createContext(null)

function useMenuContext() {
  const value = useContext(MenuContext)
  if (!value) throw new Error('Menu subcomponents must be inside <Menu>')
  return value
}

const ITEM_VARIANTS = {
  default: 'text-ink hover:bg-mint/50',
  danger: 'text-coral-deep hover:bg-coral/10',
}

const OFFSET = 6

// Transform-origin per placement so the open/close scale animates
// outward from the anchor corner.
const PLACEMENT_ORIGIN = {
  'bottom-right': 'origin-top-right',
  'bottom-left': 'origin-top-left',
  'top-right': 'origin-bottom-right',
  'top-left': 'origin-bottom-left',
}

// Compute fixed-position coordinates from the trigger's bounding rect.
// `right` / `bottom` values are measured from the viewport edge so the
// panel's anchor corner aligns with the trigger's anchor corner.
function positionFor(placement, rect) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  switch (placement) {
    case 'bottom-left':
      return { top: rect.bottom + OFFSET, left: rect.left }
    case 'top-right':
      return { bottom: vh - rect.top + OFFSET, right: vw - rect.right }
    case 'top-left':
      return { bottom: vh - rect.top + OFFSET, left: rect.left }
    default:
      return { top: rect.bottom + OFFSET, right: vw - rect.right }
  }
}

// Reusable kebab-style menu (hamburger icon → popover with menuitems).
// Compound API: <Menu> owns open state, <Menu.Trigger> renders the
// button, <Menu.Items> renders the panel, <Menu.Item> renders rows.
//
// a11y: trigger has aria-haspopup + aria-expanded + aria-controls,
// panel has role="menu", items have role="menuitem". Esc + outside
// click close the panel. Arrow-key nav not implemented yet — fine for
// 2-4 item menus; revisit if menus grow.
export default function Menu({ label, children }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return

    function handleDown(event) {
      if (panelRef.current?.contains(event.target)) return
      if (triggerRef.current?.contains(event.target)) return
      setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // triggerRef + panelRef are stable; setOpen is a stable setter. Memo
  // on (open, panelId, label) so item subcomponents don't re-render on
  // every Menu render.
  const value = useMemo(() => ({ open, setOpen, triggerRef, panelRef, panelId, label }), [open, panelId, label])

  return (
    <MenuContext.Provider value={value}>
      <div className="relative inline-flex">{children}</div>
    </MenuContext.Provider>
  )
}

function Trigger({ className = '', tooltipPlacement = 'bottom-end' }) {
  const { open, setOpen, triggerRef, panelId, label } = useMenuContext()
  return (
    <ActionIcon
      ref={triggerRef}
      icon={faBars}
      label={label}
      onClick={() => setOpen((current) => !current)}
      scheme="neutral"
      tooltip={!open}
      tooltipPlacement={tooltipPlacement}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={panelId}
      className={className}
    />
  )
}

function Items({ placement = 'bottom-right', className = '', children }) {
  const { open, panelRef, panelId, triggerRef, label } = useMenuContext()
  const shouldReduceMotion = useReducedMotion()
  const [position, setPosition] = useState(null)
  const originClass = PLACEMENT_ORIGIN[placement] ?? PLACEMENT_ORIGIN['bottom-right']
  const isTop = placement.startsWith('top')

  // Recompute position on open + scroll/resize while open. useLayoutEffect
  // avoids the one-frame flash of panel-at-(0,0). Capture-phase scroll so
  // nested scroll containers also re-anchor the panel.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    const trigger = triggerRef.current
    if (!trigger) return

    const update = () => setPosition(positionFor(placement, trigger.getBoundingClientRect()))
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, placement, triggerRef])

  const motionProps = shouldReduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95, y: isTop ? 4 : -4 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: isTop ? 4 : -4 },
        transition: { duration: 0.14, ease: [0.33, 1, 0.68, 1] },
      }

  return createPortal(
    <AnimatePresence>
      {open && position && (
        <motion.div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={label}
          style={{ position: 'fixed', zIndex: 50, ...position }}
          className={`min-w-[180px] rounded-md bg-paper shadow-warm-md ring-1 ring-paper-edge p-1 ${originClass} ${className}`}
          {...motionProps}
        >
          <ul className="list-none m-0 p-0 flex flex-col">{children}</ul>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Item({ icon, onClick, variant = 'default', children }) {
  const { setOpen } = useMenuContext()
  const variantClass = ITEM_VARIANTS[variant] ?? ITEM_VARIANTS.default
  return (
    <li className="list-none">
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClick?.()
          setOpen(false)
        }}
        className={`w-full flex items-center gap-2 py-[7px] px-[10px] rounded-md text-left text-sm font-semibold cursor-pointer transition-colors ${variantClass}`}
      >
        {icon && (
          <span aria-hidden="true" className="shrink-0 w-4 h-4 flex items-center justify-center">
            <FontAwesomeIcon icon={icon} className="w-3 h-3" />
          </span>
        )}
        <span className="truncate">{children}</span>
      </button>
    </li>
  )
}

function Divider() {
  return (
    <li role="presentation" className="list-none">
      <hr className="my-1 border-0 border-t border-paper-edge" />
    </li>
  )
}

Menu.Trigger = Trigger
Menu.Items = Items
Menu.Item = Item
Menu.Divider = Divider
