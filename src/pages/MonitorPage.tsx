import { EquipmentPanel } from '../components/EquipmentPanel'
import { JunctionMap } from '../components/JunctionMap'
import { NotificationPanel } from '../components/NotificationPanel'
import { useTrafficStore } from '../store/useTrafficStore'

export function MonitorPage() {
  const devices = useTrafficStore((s) => s.devices)
  const activityLog = useTrafficStore((s) => s.activityLog)
  const tick = useTrafficStore((s) => s.tick)
  const simPaused = useTrafficStore((s) => s.simPaused)
  const hasCriticalFault =
    devices.some((d) => d.type === 'controller' && d.status !== 'online') ||
    devices.filter((d) => d.status === 'offline').length >= 2

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      {hasCriticalFault && (
        <div className="rounded-lg border border-[var(--color-danger)]/40 bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)] px-4 py-3 text-sm text-[#ffd2d2]">
          Critical device issue detected — signal remains on approved local fallback timing
          plan until equipment is restored.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-muted)]">
        <span className="rounded-full border border-[var(--color-line)] px-2 py-1 font-mono">
          tick {tick}
        </span>
        <span
          className={
            simPaused ? 'text-[var(--color-amber)]' : 'text-[var(--color-mint)]'
          }
        >
          {simPaused ? 'Simulation paused' : 'Live sample feed running'}
        </span>
        <span>Click approach markers / buses for controls</span>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="min-h-0 flex-1">
            <JunctionMap />
          </div>
          <EquipmentPanel />
        </div>

        <div className="flex min-h-0 flex-col gap-4">
          <div className="min-h-[320px] flex-1">
            <NotificationPanel />
          </div>
          <section className="glass max-h-48 overflow-auto rounded-xl p-3">
            <div className="mb-2 text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
              Activity log
            </div>
            <ul className="space-y-2">
              {activityLog.slice(0, 8).map((l) => (
                <li key={l.id} className="text-xs text-[var(--color-muted)]">
                  <span className="font-mono text-[10px] text-white/70">
                    {new Date(l.time).toLocaleTimeString()}
                  </span>{' '}
                  <span className="text-[var(--color-mint)]">{l.actor}</span> — {l.action}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
