import {
  Activity,
  AlertTriangle,
  CarFront,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Monitor', icon: LayoutDashboard, end: true },
  { to: '/faults', label: 'Faults', icon: AlertTriangle },
  { to: '/control', label: 'Control', icon: Gauge },
  { to: '/analytics', label: 'Analytics', icon: Activity },
  { to: '/twin', label: 'Automation', icon: Sparkles },
  { to: '/driver', label: 'Driver', icon: CarFront },
  { to: '/system', label: 'System', icon: Settings2 },
]

export function Sidebar() {
  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--color-line)] bg-[#070d18]">
      <div className="border-b border-[var(--color-line)] px-5 py-5">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-[var(--color-mint)]">
          STMS COLOMBO
        </div>
        <div className="mt-1 text-sm font-semibold text-white">Smart Traffic</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                isActive
                  ? 'bg-[color-mix(in_oklab,var(--color-mint)_16%,transparent)] text-[var(--color-mint)]'
                  : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--color-line)] p-4 text-xs text-[var(--color-muted)]">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle size={14} />
          Prototype demo
        </div>
        Sample data only — no live signal control.
      </div>
    </aside>
  )
}
