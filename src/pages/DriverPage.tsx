import { AlertTriangle, Check, MapPinned, Navigation } from 'lucide-react'
import { useState } from 'react'
import { junctionSites } from '../data/network'
import { HEAVY_QUEUE, driverMessage } from '../lib/rules'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'

export function DriverPage() {
  const junction = useTrafficStore(selectActiveJunction)
  const routes = useTrafficStore((s) => s.routes)
  const selectedRouteId = useTrafficStore((s) => s.selectedRouteId)
  const selectRoute = useTrafficStore((s) => s.selectRoute)
  const pending = useTrafficStore((s) =>
    s.recommendations.some((r) => r.junctionId === junction.id && r.status === 'pending'),
  )
  const [showRoutes, setShowRoutes] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(() => new Date().toLocaleTimeString())

  const maxQueue = Math.max(...junction.approaches.map((a) => a.queueLength))
  const location = junctionSites.find((site) => site.id === junction.id)!.name
  const message = driverMessage(maxQueue, pending, location)
  const selected = routes.find((r) => r.id === selectedRouteId)

  return (
    <div className="grid min-h-full place-items-center bg-[radial-gradient(circle_at_top,#1a2740,var(--color-shell))] p-6">
      <div className="w-full max-w-sm rounded-[2rem] border border-[var(--color-line)] bg-[#050a14] p-3 shadow-2xl shadow-black/40">
        <div className="rounded-[1.5rem] bg-[var(--color-panel)] p-5">
          <div className="mb-6 flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span>STMS Alerts</span>
            <button
              type="button"
              onClick={() => setLastRefresh(new Date().toLocaleTimeString())}
              className="font-mono hover:text-white"
              title="Refresh"
            >
              {lastRefresh} · tap refresh
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2 text-[var(--color-mint)]">
            <MapPinned size={18} />
            <span className="text-sm font-semibold">Near {location}</span>
          </div>

          <div
            className={[
              'rounded-2xl border p-4',
              maxQueue >= HEAVY_QUEUE
                ? 'border-[var(--color-amber)]/50 bg-[color-mix(in_oklab,var(--color-amber)_12%,transparent)]'
                : 'border-[var(--color-line)] bg-black/20',
            ].join(' ')}
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle size={16} className="text-[var(--color-amber)]" />
              Traffic update
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">{message}</p>
          </div>

          <div className="mt-4 space-y-2">
            {junction.approaches.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-sm"
              >
                <span className="text-[var(--color-muted)]">{a.direction}</span>
                <span className="font-mono text-white">
                  Q {Math.round(a.queueLength)} · {a.avgWaitSec}s
                </span>
              </div>
            ))}
          </div>

          {!showRoutes ? (
            <button
              type="button"
              onClick={() => setShowRoutes(true)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-mint)] py-3 text-sm font-semibold text-[#042016]"
            >
              <Navigation size={16} />
              View alternate routes
            </button>
          ) : (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span>Alternate routes</span>
                <button
                  type="button"
                  onClick={() => setShowRoutes(false)}
                  className="hover:text-white"
                >
                  Hide
                </button>
              </div>
              {routes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectRoute(r.id)}
                  className={[
                    'w-full rounded-xl border p-3 text-left',
                    selectedRouteId === r.id
                      ? 'border-[var(--color-mint)] bg-[var(--color-mint)]/10'
                      : 'border-[var(--color-line)] bg-black/20',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    {selectedRouteId === r.id && (
                      <Check size={14} className="text-[var(--color-mint)]" />
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--color-muted)]">
                    via {r.via.join(' → ')}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[11px] text-[var(--color-muted)]">
                    <span>
                      {r.distanceKm} km · {r.etaMin} min
                    </span>
                    <span
                      className={
                        r.crowd === 'Light'
                          ? 'text-[var(--color-mint)]'
                          : r.crowd === 'Medium'
                            ? 'text-[var(--color-amber)]'
                            : 'text-[var(--color-danger)]'
                      }
                    >
                      {r.crowd} · {r.status}
                    </span>
                  </div>
                </button>
              ))}

              {selected && (
                <div className="rounded-xl border border-[var(--color-mint)]/40 bg-black/30 p-3 text-xs text-[var(--color-muted)]">
                  Selected:{' '}
                  <span className="text-white">{selected.name}</span> — ETA about{' '}
                  {selected.etaMin} min. Guidance is advisory only.
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-[var(--color-muted)]">
            Public channel — no signal control access
          </p>
        </div>
      </div>
    </div>
  )
}
