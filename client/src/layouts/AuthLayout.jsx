import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Outlet, useLocation } from 'react-router-dom'
import AuthMarketing from '../components/auth/AuthMarketing'

const variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 1, transition: { duration: 0 } },
}

export default function AuthLayout() {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion()
  const transition = shouldReduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.33, 1, 0.68, 1] }

  return (
    <div className="min-h-dvh lg:h-dvh lg:grid lg:grid-cols-2">
      <aside className="hidden lg:flex bg-[image:var(--gradient-forest-marketing)] text-paper relative overflow-hidden">
        <AuthMarketing />
      </aside>

      <div className="relative min-h-dvh lg:min-h-0 lg:h-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
