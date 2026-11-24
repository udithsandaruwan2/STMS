import { useState } from 'react'
import { junctionSites } from '../data/network'
import { isInFallback } from '../lib/networkSimulation'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'
import type { Direction } from '../types'

const dirs: Direction[] = ['North', 'South', 'East', 'West']

export function ControlPage() {
  const recommendations = useTrafficStore((s) => s.recommendations)
  const reviewRecommendation = useTrafficStore((s) => s.reviewRecommendation)
  const requestAiSuggestion = useTrafficStore((s) => s.requestAiSuggestion)
  const junction = useTrafficStore(selectActiveJunction)
  const setApproachGreen = useTrafficStore((s) => s.setApproachGreen)
  const setApproachPhase = useTrafficStore((s) => s.setApproachPhase)
  const adaptiveMode = junction.adaptive
  const devices = useTrafficStore((state) => state.devices)
  const fallback = isInFallback(junction.id, devices)
  const setAdaptiveMode = useTrafficStore((s) => s.setAdaptiveMode)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [manualDir, setManualDir] = useState<Direction>('North')

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Intelligent decision review</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {junction.name} · Timing suggestions require approval (
            {junction.normalGreenSec}s → {junction.heavyGreenSec}s).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={fallback}
            onClick={() => setAdaptiveMode(!adaptiveMode)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            {adaptiveMode ? 'Disable adaptive' : 'Enable adaptive'}
          </button>
          <button
            type="button"
            disabled={fallback}
            onClick={() => requestAiSuggestion(manualDir)}
            className="rounded-lg bg-[var(--color-mint)] px-3 py-2 text-xs font-semibold text-[#042016]"
          >
            Request timing suggestion
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <h2 className="text-sm font-semibold text-white">Manual override (demo)</h2>
        <p className="mt-1 text-xs text-slate-400">Opposing approaches share a green duration. Manual phase requests wait for clearance.</p>
        {fallback && <p className="mt-2 text-xs text-amber-200">This junction is on fixed fallback. Restore equipment to change timing.</p>}
        <fieldset disabled={fallback} className="mt-3 flex flex-wrap items-center gap-2 disabled:opacity-50">
          <select
            aria-label="Manual approach"
            value={manualDir}
            onChange={(e) => setManualDir(e.target.value as Direction)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-sm text-white"
          >
            {dirs.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setApproachGreen(manualDir, junction.normalGreenSec)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Set {junction.normalGreenSec}s
          </button>
          <button
            type="button"
            onClick={() => setApproachGreen(manualDir, junction.heavyGreenSec)}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Set {junction.heavyGreenSec}s
          </button>
          {(['green', 'amber', 'red'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setApproachPhase(manualDir, p)}
              className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs capitalize text-white hover:bg-white/5"
            >
              Request {p}
            </button>
          ))}
        </fieldset>
      </section>

      <div className="space-y-3">
        {recommendations.length === 0 && (
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-6 text-sm text-[var(--color-muted)]">
            No recommendations yet. Request an AI suggestion or wait for the simulator.
          </div>
        )}

        {recommendations.map((r) => (
          <article
            key={r.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs tracking-wide text-[var(--color-mint)] uppercase">
                  {junctionSites.find((site) => site.id === r.junctionId)?.name} · Signal timing suggestion
                </div>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  {r.approach} approach: {r.fromSec}s → {r.toSec}s green
                </h2>
              </div>
              <span
                className={[
                  'rounded-full px-2.5 py-1 text-xs font-semibold uppercase',
                  r.status === 'pending'
                    ? 'bg-[var(--color-amber)] text-black'
                    : r.status === 'approved'
                      ? 'bg-[var(--color-mint)] text-[#042016]'
                      : 'bg-slate-600 text-white',
                ].join(' ')}
              >
                {r.status}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-black/25 p-3">
                <dt className="text-[11px] text-[var(--color-muted)]">Observed queue</dt>
                <dd className="font-mono text-lg text-white">{r.queueLength} vehicles</dd>
              </div>
              <div className="rounded-lg bg-black/25 p-3">
                <dt className="text-[11px] text-[var(--color-muted)]">Confidence</dt>
                <dd className="font-mono text-lg text-white">{r.confidence}%</dd>
              </div>
              <div className="rounded-lg bg-black/25 p-3">
                <dt className="text-[11px] text-[var(--color-muted)]">Created</dt>
                <dd className="font-mono text-sm text-white">
                  {new Date(r.createdAt).toLocaleTimeString()}
                </dd>
              </div>
              <div className="rounded-lg bg-black/25 p-3">
                <dt className="text-[11px] text-[var(--color-muted)]">Pedestrian protect</dt>
                <dd className="font-mono text-lg text-white">
                  {junction.pedestrianProtectSec}s unchanged
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
              {r.reason}
            </p>

            {r.status === 'pending' ? (
              <div className="mt-4 space-y-3">
                <textarea
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] p-3 text-sm text-white outline-none focus:border-[var(--color-mint)]"
                  rows={2}
                  placeholder="Operator note (required for reject)"
                  value={notes[r.id] ?? ''}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--color-mint)] px-4 py-2 text-sm font-semibold text-[#042016]"
                    disabled={isInFallback(r.junctionId, devices)}
                    onClick={() =>
                      reviewRecommendation(
                        r.id,
                        'approved',
                        notes[r.id] || 'Approved under supervised pilot demo',
                      )
                    }
                  >
                    Approve suggestion
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm text-white hover:bg-white/5"
                    onClick={() =>
                      reviewRecommendation(
                        r.id,
                        'rejected',
                        notes[r.id] || 'Rejected — retain fixed plan',
                      )
                    }
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-black/20 p-3 text-sm text-[var(--color-muted)]">
                Reviewed {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : '—'}
                {r.operatorNote ? ` — ${r.operatorNote}` : ''}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
