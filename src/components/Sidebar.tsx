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
    <aside className="flex w-12 shrink-0 sm:w-16 lg:w-[190px] flex-col border-r border-[var(--color-line)] bg-[#070d18]">
      <div className="border-b border-[var(--color-line)] px-2 py-4 text-center lg:px-5 lg:py-5 lg:text-left">
        <div className="text-[11px] font-semibold tracking-[0.22em] text-[var(--color-mint)]">
          STMS<span className="hidden lg:inline"> COLOMBO</span>
        </div>
        <div className="mt-1 hidden text-sm font-semibold text-white lg:block">Smart Traffic</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-1.5 lg:p-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            title={label}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 lg:justify-start lg:px-3 text-sm transition',
                isActive
                  ? 'bg-[color-mix(in_oklab,var(--color-mint)_16%,transparent)] text-[var(--color-mint)]'
                  : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white',
              ].join(' ')
            }
          >
            <Icon size={18} />
            <span className="hidden lg:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden border-t border-[var(--color-line)] p-4 lg:block text-xs text-[var(--color-muted)]">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle size={14} />
          Prototype demo
        </div>
        Sample data only — no live signal control.
      </div>
    </aside>
  )
}
