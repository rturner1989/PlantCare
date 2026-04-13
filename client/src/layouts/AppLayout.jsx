import { Outlet } from 'react-router-dom'
import Dock from '../components/Dock'
import Sidebar from '../components/Sidebar'

export default function AppLayout() {
  return (
    <div className="min-h-dvh">
      <Sidebar />

      <main className="lg:ml-[260px] pb-24 lg:pb-0 min-h-dvh">
        <Outlet />
      </main>

      <Dock />
    </div>
  )
}
