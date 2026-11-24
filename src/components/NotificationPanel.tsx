import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { junctionSites } from '../data/network'
import { useTrafficStore } from '../store/useTrafficStore'
import type { Severity } from '../types'

const filters: Array<{ key: 'all' | Severity; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'high', label: 'High' },
  { key: 'minor', label: 'Minor' },
  { key: 'info', label: 'Info' },
]

function badge(severity: Severity) {
  if (severity === 'critical') return 'bg-[var(--color-danger)]'
  if (severity === 'high') return 'bg-[var(--color-amber)] text-black'
  if (severity === 'minor') return 'bg-sky-500/80'
  return 'bg-slate-500'
}

export function NotificationPanel({
  floating = false,
  onClose,
}: {
  floating?: boolean
  onClose?: () => void
}) {
  const navigate = useNavigate()
  const incidents = useTrafficStore((s) => s.incidents)
  const acknowledgeIncident = useTrafficStore((s) => s.acknowledgeIncident)
  const dismissIncident = useTrafficStore((s) => s.dismissIncident)
  const injectIncident = useTrafficStore((s) => s.injectIncident)
  const selectApproach = useTrafficStore((s) => s.selectApproach)
  const [filter, setFilter] = useState<'all' | Severity>('all')
  const [showAcked, setShowAcked] = useState(true)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: incidents.length }
    for (const i of incidents) c[i.severity] = (c[i.severity] ?? 0) + 1
    return c
  }, [incidents])

  const visible = incidents.filter(
    (i) =>
      (filter === 'all' || i.severity === filter) &&
      (showAcked || !i.acknowledged),
  )

  return (
    <section
      className={[
        'glass flex h-full min-h-0 flex-col rounded-xl p-4',
        floating ? 'w-[min(360px,calc(100vw-5rem))] max-h-[70vh] shadow-2xl' : '',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Notifications</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-[var(--color-muted)]">
            {incidents.length}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--color-muted)] hover:text-white"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={[
              'rounded-md px-2 py-1 text-[11px]',
              filter === f.key
                ? 'bg-[var(--color-mint)] text-[#042016] font-semibold'
                : 'bg-black/30 text-[var(--color-muted)] hover:text-white',
            ].join(' ')}
          >
            {f.label} {counts[f.key] ?? 0}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAcked((v) => !v)}
          className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-muted)] hover:text-white"
        >
          {showAcked ? 'Hide acknowledged' : 'Show acknowledged'}
        </button>
        <button
          type="button"
          onClick={() =>
            injectIncident({
              title: 'Operator-logged congestion',
              category: 'Traffic',
              severity: 'high',
              approach: 'North',
            })
          }
          className="rounded-md bg-[var(--color-mint)]/20 px-2 py-1 text-[11px] text-[var(--color-mint)] hover:bg-[var(--color-mint)]/30"
        >
          + Inject incident
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
        {visible.length === 0 && (
          <div className="rounded-lg border border-[var(--color-line)] p-3 text-xs text-[var(--color-muted)]">
            No notifications in this filter.
          </div>
        )}
        {visible.map((n) => (
          <article
            key={n.id}
            className={[
              'rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] p-3',
              n.acknowledged ? 'opacity-60' : '',
            ].join(' ')}
          >
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badge(n.severity)}`}
              >
                {n.severity}
              </span>
              <span className="text-[11px] text-[var(--color-muted)]">{n.category}</span>
              {n.acknowledged && (
                <span className="text-[10px] text-[var(--color-mint)]">ACK</span>
              )}
            </div>
            <div className="text-sm font-medium text-white">{n.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
              {n.message}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-[var(--color-muted)]">
                {new Date(n.timestamp).toLocaleTimeString()}
              </span>
                <button
                  type="button"
                  onClick={() => {
                    selectApproach(n.approach ?? null, n.junctionId)
                    onClose?.()
                    navigate('/')
                  }}
                  className="text-[10px] text-[var(--color-mint)] hover:underline"
                >
                  {junctionSites.find((site) => site.id === n.junctionId)?.name}{n.approach ? ` · ${n.approach}` : ''}
                </button>
              {!n.acknowledged && (
                <button
                  type="button"
                  onClick={() => acknowledgeIncident(n.id)}
                  className="text-[10px] text-white hover:underline"
                >
                  Acknowledge
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissIncident(n.id)}
                className="text-[10px] text-[var(--color-danger)] hover:underline"
              >
                Dismiss
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
