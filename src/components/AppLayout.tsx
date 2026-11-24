import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTrafficStore } from '../store/useTrafficStore'
import { CameraModal } from './CameraModal'
import { NotificationPanel } from './NotificationPanel'
import { Sidebar } from './Sidebar'
import { Toast } from './Toast'
import { TopBar } from './TopBar'

const titles: Record<string, string> = {
  '/': 'Monitor',
  '/faults': 'Faults',
  '/control': 'Control',
  '/analytics': 'Analytics',
  '/twin': 'Automation / Digital Twin',
  '/driver': 'Driver Alerts',
  '/system': 'System',
}

export function AppLayout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const startSimulator = useTrafficStore((s) => s.startSimulator)
  const notifOpen = useTrafficStore((s) => s.notifOpen)
  const setNotifOpen = useTrafficStore((s) => s.setNotifOpen)

  useEffect(() => startSimulator(), [startSimulator])
  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [location.key])

  return (
    <div className="flex h-full min-h-0 bg-[var(--color-shell)]">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopBar title={titles[location.pathname] ?? 'STMS'} />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-auto">
          <Outlet />
        </main>

        {notifOpen && (
          <div className="absolute top-16 right-4 z-50">
            <NotificationPanel floating onClose={() => setNotifOpen(false)} />
          </div>
        )}

        <CameraModal />
        <Toast />
      </div>
    </div>
  )
}
