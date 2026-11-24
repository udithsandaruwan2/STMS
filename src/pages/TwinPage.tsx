import { isInFallback, signalAxes } from '../lib/networkSimulation'
import { estimateWait, HEAVY_QUEUE } from '../lib/rules'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'

export function TwinPage() {
  const junction = useTrafficStore(selectActiveJunction)
  const adaptiveMode = junction.adaptive
  const devices = useTrafficStore((state) => state.devices)
  const fallback = isInFallback(junction.id, devices)
  const setAdaptiveMode = useTrafficStore((s) => s.setAdaptiveMode)
  const setApproachGreen = useTrafficStore((s) => s.setApproachGreen)
  const setScenario = useTrafficStore((s) => s.setScenario)
  const scenario = useTrafficStore((s) => s.scenario)
  const north = junction.approaches.find((a) => a.direction === 'North')!

  const fixedWait = estimateWait(north.queueLength, junction.normalGreenSec)
  const adaptiveWait = estimateWait(north.queueLength, junction.heavyGreenSec)

  const applyAdaptiveAll = () => {
    for (const axis of signalAxes) {
      const congested = junction.approaches.some((approach) =>
        axis.includes(approach.direction) && approach.queueLength >= HEAVY_QUEUE)
      setApproachGreen(axis[0], congested ? junction.heavyGreenSec : junction.normalGreenSec)
    }
    setAdaptiveMode(true)
  }

  const applyFixedAll = () => {
    setAdaptiveMode(false)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Digital twin — what if</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {junction.name} · Compare fixed and adaptive green. Wait estimates are
            only.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScenario('morning-peak')}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Load morning peak
          </button>
          <button
            type="button"
            disabled={fallback}
            onClick={() => setAdaptiveMode(!adaptiveMode)}
            className={[
              'rounded-lg px-4 py-2 text-sm font-semibold',
              adaptiveMode
                ? 'bg-[var(--color-mint)] text-[#042016]'
                : 'border border-[var(--color-line)] text-white',
            ].join(' ')}
          >
            {adaptiveMode ? 'Adaptive mode ON' : 'Enable adaptive mode'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
          <div className="text-xs tracking-wide text-[var(--color-amber)] uppercase">
            Fixed plan
          </div>
          <div className="mt-2 font-mono text-4xl text-white">
            {junction.normalGreenSec}s
          </div>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Estimated North wait with current queue (
            {Math.round(north.queueLength)}):{' '}
            <span className="font-mono text-white">{fixedWait}s</span>
          </p>
          <button
            type="button"
            disabled={fallback} onClick={applyFixedAll}
            className="mt-4 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Apply fixed plan at this junction
          </button>
        </section>

        <section className="rounded-xl border border-[var(--color-mint)]/40 bg-[var(--color-panel)] p-5">
          <div className="text-xs tracking-wide text-[var(--color-mint)] uppercase">
            Adaptive heavy plan
          </div>
          <div className="mt-2 font-mono text-4xl text-white">
            {junction.heavyGreenSec}s
          </div>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Estimated North wait with current queue (
            {Math.round(north.queueLength)}):{' '}
            <span className="font-mono text-white">{adaptiveWait}s</span>
          </p>
          <button
            type="button"
            disabled={fallback} onClick={applyAdaptiveAll}
            className="mt-4 rounded-lg bg-[var(--color-mint)] px-3 py-2 text-xs font-semibold text-[#042016]"
          >
            Apply adaptive rules to congested approaches
          </button>
        </section>
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5">
        <h2 className="text-sm font-semibold text-white">Per-approach twin state</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {junction.approaches.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-black/20 px-3 py-3"
            >
              <div>
                <div className="text-sm text-white">{a.direction}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  Q {Math.round(a.queueLength)} · wait {a.avgWaitSec}s
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={fallback} onClick={() => setApproachGreen(a.direction, junction.normalGreenSec)}
                  className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-white"
                >
                  {junction.normalGreenSec}s
                </button>
                <button
                  type="button"
                  disabled={fallback} onClick={() => setApproachGreen(a.direction, junction.heavyGreenSec)}
                  className="rounded-md bg-[var(--color-mint)]/20 px-2 py-1 text-[11px] text-[var(--color-mint)]"
                >
                  {junction.heavyGreenSec}s
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-5 text-sm text-[var(--color-muted)]">
        <p>
          Scenario: <span className="text-white">{scenario}</span>. Difference on North:{' '}
          <span className="font-mono text-[var(--color-mint)]">
            {Math.max(0, fixedWait - adaptiveWait)}s
          </span>{' '}
          illustrative reduction. Pedestrian protect remains {junction.pedestrianProtectSec}
          s.
        </p>
      </div>
    </div>
  )
}
