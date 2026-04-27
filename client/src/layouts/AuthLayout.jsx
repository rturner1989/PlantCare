import { Outlet } from 'react-router-dom'
import AuthMarketing from '../components/auth/AuthMarketing'

export default function AuthLayout() {
  return (
    <div className="min-h-dvh lg:h-dvh lg:grid lg:grid-cols-2">
      <aside className="hidden lg:flex bg-[image:var(--gradient-forest-marketing)] text-paper relative overflow-hidden">
        <AuthMarketing />
      </aside>

      <Outlet />
    </div>
  )
}
