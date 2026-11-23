import { Link } from 'react-router-dom'
import { useTrafficStore } from '../store/useTrafficStore'

const steps = [
  'Collect traffic data from cameras, sensors and GPS',
  'Analyse queues and busy approaches',
  'Predict congestion from sample history',
  'Suggest safe traffic-light timing',
  'Provide alerts to authorities and drivers',
]

export function SystemPage() {
  const activityLog = useTrafficStore((s) => s.activityLog)
  const tick = useTrafficStore((s) => s.tick)
  const scenario = useTrafficStore((s) => s.scenario)
  const setScenario = useTrafficStore((s) => s.setScenario)
  const setSimPaused = useTrafficStore((s) => s.setSimPaused)
  const simPaused = useTrafficStore((s) => s.simPaused)
  const restoreAllDevices = useTrafficStore((s) => s.restoreAllDevices)
  const injectIncident = useTrafficStore((s) => s.injectIncident)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-white">System overview</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Conceptual Smart Traffic Management System prototype for Assignment 2 —
          COHNDIS261F-019.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
        <h2 className="text-sm font-semibold text-white">How the system works</h2>
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm text-[var(--color-muted)]">
              <span className="font-mono text-[var(--color-mint)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
        <h2 className="text-sm font-semibold text-white">Demo controls</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Tick {tick} · scenario {scenario}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSimPaused(!simPaused)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            {simPaused ? 'Resume sim' : 'Pause sim'}
          </button>
          <button
            type="button"
            onClick={() => setScenario('morning-peak')}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Morning peak
          </button>
          <button
            type="button"
            onClick={() => setScenario('emergency')}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Emergency drill
          </button>
          <button
            type="button"
            onClick={restoreAllDevices}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Restore devices
          </button>
          <button
            type="button"
            onClick={() => injectIncident()}
            className="rounded-lg bg-[var(--color-mint)] px-3 py-2 text-xs font-semibold text-[#042016]"
          >
            Inject incident
          </button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {[
          ['Monitor', '/', 'Live junction map, equipment KPIs, notifications'],
          ['Control', '/control', 'Approve or reject AI timing suggestions'],
          ['Analytics', '/analytics', 'Sample peak-hour and wait-time charts'],
          ['Driver', '/driver', 'Public mobile-style route alerts'],
        ].map(([title, to, desc]) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4 transition hover:border-[var(--color-mint)]/50"
          >
            <div className="text-sm font-semibold text-white">{title}</div>
            <div className="mt-1 text-xs text-[var(--color-muted)]">{desc}</div>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Recent activity</h2>
        <ul className="max-h-48 space-y-2 overflow-auto">
          {activityLog.slice(0, 12).map((l) => (
            <li key={l.id} className="text-xs text-[var(--color-muted)]">
              <span className="font-mono text-white/60">
                {new Date(l.time).toLocaleTimeString()}
              </span>{' '}
              {l.action}
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-[var(--color-muted)]">
        Planning docs live in <code className="text-[var(--color-mint)]">/docs</code>. This
        build uses dummy data only and does not actuate real traffic signals.
      </p>
    </div>
  )
}
