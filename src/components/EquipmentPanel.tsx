import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isInFallback } from '../lib/networkSimulation'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'
import type { ScenarioId } from '../types'

const tabs = ['Equipment', 'Control', 'Comms', 'Scenarios'] as const

const scenarios: Array<{ id: ScenarioId; label: string; desc: string }> = [
  { id: 'live', label: 'Live sample', desc: 'Default demo queues' },
  { id: 'morning-peak', label: 'Morning peak', desc: 'Heavy queues across the network' },
  { id: 'off-peak', label: 'Off-peak', desc: 'Light traffic' },
  { id: 'incident', label: 'Lane incident', desc: 'Thummulla west approach restriction' },
  { id: 'emergency', label: 'Emergency V2X', desc: 'Galle Road ambulance priority drill' },
]

export function EquipmentPanel() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Equipment')
  const navigate = useNavigate()
  const allDevices = useTrafficStore((s) => s.devices)
  const recommendations = useTrafficStore((s) => s.recommendations)
  const junction = useTrafficStore(selectActiveJunction)
  const scenario = useTrafficStore((s) => s.scenario)
  const setScenario = useTrafficStore((s) => s.setScenario)
  const setAdaptiveMode = useTrafficStore((s) => s.setAdaptiveMode)
  const adaptiveMode = junction.adaptive
  const requestAiSuggestion = useTrafficStore((s) => s.requestAiSuggestion)
  const restoreAllDevices = useTrafficStore((s) => s.restoreAllDevices)
  const openCamera = useTrafficStore((s) => s.openCamera)

  const stats = useMemo(() => {
    const devices = allDevices.filter((device) => device.junctionId === junction.id || device.type === 'gps')
    const cameras = devices.filter((d) => d.type === 'camera')
    const sensors = devices.filter((d) => d.type === 'sensor')
    const controllers = devices.filter((d) => d.type === 'controller')
    const gps = devices.filter((d) => d.type === 'gps')
    const healthy = (list: typeof devices) =>
      list.filter((d) => d.status === 'online').length

    return [
      {
        label: 'Faulty controllers',
        value: `${controllers.length - healthy(controllers)} / ${controllers.length}`,
        tone: controllers.every((d) => d.status === 'online') ? 'ok' : 'bad',
      },
      {
        label: 'Cameras degraded/off',
        value: `${cameras.length - healthy(cameras)}`,
        tone: healthy(cameras) === cameras.length ? 'ok' : 'warn',
      },
      {
        label: 'Sensors healthy',
        value: `${healthy(sensors)} / ${sensors.length}`,
        tone: healthy(sensors) === sensors.length ? 'ok' : 'warn',
      },
      {
        label: 'GPS tracks live',
        value: `${healthy(gps)} / ${gps.length}`,
        tone: 'ok',
      },
      {
        label: 'Pending AI actions',
        value: `${recommendations.filter((r) => r.junctionId === junction.id && r.status === 'pending').length}`,
        tone: 'bad',
      },
      {
        label: 'Fallback plan',
        value: isInFallback(junction.id, allDevices) ? 'Active' : 'Ready',
        tone: 'neutral',
      },
    ] as const
  }, [allDevices, junction.id, recommendations])

  return (
    <section className="glass rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{junction.city}</div>
          <div className="text-xs text-[var(--color-muted)]">{junction.name}</div>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-black/30 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={[
                'rounded-md px-3 py-1 text-xs',
                tab === t
                  ? 'bg-[var(--color-mint)] text-[#042016] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-white',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Equipment' && (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] p-3"
              >
                <div className="text-[11px] text-[var(--color-muted)]">{s.label}</div>
                <div
                  className={[
                    'mt-1 font-mono text-lg font-semibold',
                    s.tone === 'ok'
                      ? 'text-[var(--color-mint)]'
                      : s.tone === 'warn'
                        ? 'text-[var(--color-amber)]'
                        : s.tone === 'bad'
                          ? 'text-[var(--color-danger)]'
                          : 'text-white',
                  ].join(' ')}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/faults')}
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs text-white hover:bg-white/5"
            >
              Manage devices
            </button>
            <button
              type="button"
              onClick={restoreAllDevices}
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs text-white hover:bg-white/5"
            >
              Restore all
            </button>
            <button
              type="button"
              onClick={() => openCamera()}
              className="rounded-md bg-[var(--color-mint)] px-3 py-1.5 text-xs font-semibold text-[#042016]"
            >
              Open cameras
            </button>
          </div>
        </>
      )}

      {tab === 'Control' && (
        <div className="space-y-3 text-sm text-[var(--color-muted)]">
          <p>
            Normal green:{' '}
            <span className="font-mono text-white">{junction.normalGreenSec}s</span>
          </p>
          <p>
            Heavy green (illustrative):{' '}
            <span className="font-mono text-white">{junction.heavyGreenSec}s</span>
          </p>
          <p>
            Pedestrian protect:{' '}
            <span className="font-mono text-white">{junction.pedestrianProtectSec}s</span>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAdaptiveMode(!adaptiveMode)}
              className="rounded-md bg-[var(--color-mint)] px-3 py-1.5 text-xs font-semibold text-[#042016]"
            >
              {adaptiveMode ? 'Disable adaptive' : 'Enable adaptive'}
            </button>
            <button
              type="button"
              onClick={() => requestAiSuggestion('North')}
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs text-white hover:bg-white/5"
            >
              Request AI suggestion
            </button>
            <button
              type="button"
              onClick={() => navigate('/control')}
              className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs text-white hover:bg-white/5"
            >
              Open review queue
            </button>
          </div>
        </div>
      )}

      {tab === 'Comms' && (
        <div className="space-y-2 text-sm text-[var(--color-muted)]">
          <p>Uplink: simulated 4G / fibre hybrid — latency ~42 ms</p>
          <p>Controller heartbeat: local fallback armed</p>
          <p>Public driver channel: read-only alerts</p>
          <p>V2X sample channel: emergency beacon ready</p>
          <button
            type="button"
            onClick={() => navigate('/driver')}
            className="mt-2 rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs text-white hover:bg-white/5"
          >
            Open driver channel
          </button>
        </div>
      )}

      {tab === 'Scenarios' && (
        <div className="grid gap-2 sm:grid-cols-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenario(s.id)}
              className={[
                'rounded-lg border p-3 text-left',
                scenario === s.id
                  ? 'border-[var(--color-mint)] bg-[var(--color-mint)]/10'
                  : 'border-[var(--color-line)] bg-[var(--color-panel-2)] hover:border-white/20',
              ].join(' ')}
            >
              <div className="text-sm font-semibold text-white">{s.label}</div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">{s.desc}</div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 border-t border-[var(--color-line)] pt-2 font-mono text-[11px] text-[var(--color-muted)]">
        {junction.name} · {junction.lat.toFixed(4)}, {junction.lng.toFixed(4)} ·
        Scenario: {scenario}
      </div>
    </section>
  )
}
