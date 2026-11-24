import { Camera, Cpu, Navigation, Radio } from 'lucide-react'
import { useMemo, useState } from 'react'
import { junctionSites } from '../data/network'
import { useTrafficStore } from '../store/useTrafficStore'
import type { DeviceStatus, DeviceType } from '../types'

const icons: Record<DeviceType, typeof Camera> = {
  camera: Camera,
  sensor: Radio,
  gps: Navigation,
  controller: Cpu,
}

function statusClass(status: string) {
  if (status === 'online') return 'text-[var(--color-mint)]'
  if (status === 'degraded') return 'text-[var(--color-amber)]'
  return 'text-[var(--color-danger)]'
}

export function FaultsPage() {
  const devices = useTrafficStore((s) => s.devices)
  const toggleDeviceFault = useTrafficStore((s) => s.toggleDeviceFault)
  const setDeviceStatus = useTrafficStore((s) => s.setDeviceStatus)
  const restoreAllDevices = useTrafficStore((s) => s.restoreAllDevices)
  const openCamera = useTrafficStore((s) => s.openCamera)
  const selectDevice = useTrafficStore((s) => s.selectDevice)
  const selectedDeviceId = useTrafficStore((s) => s.selectedDeviceId)
  const [siteFilter, setSiteFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | DeviceType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | DeviceStatus>('all')

  const visible = useMemo(
    () =>
      devices.filter(
        (d) =>
          (siteFilter === 'all' || d.junctionId === siteFilter) &&
          (typeFilter === 'all' || d.type === typeFilter) &&
          (statusFilter === 'all' || d.status === statusFilter),
      ),
    [devices, siteFilter, typeFilter, statusFilter],
  )

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Roadside equipment</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Device health across the Colombo demo network. Controller faults activate a local fixed plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={restoreAllDevices}
            className="rounded-lg bg-[var(--color-mint)] px-3 py-2 text-xs font-semibold text-[#042016]"
          >
            Restore all devices
          </button>
          <button
            type="button"
            onClick={() => openCamera()}
            className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            Open cameras
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select aria-label="Filter equipment by junction" value={siteFilter}
          onChange={(event) => setSiteFilter(event.target.value)}
          className="rounded-md border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-white">
          <option value="all">All junctions</option>
          {junctionSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
        {(['all', 'camera', 'sensor', 'gps', 'controller'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={[
              'rounded-md px-3 py-1.5 text-xs capitalize',
              typeFilter === t
                ? 'bg-[var(--color-mint)] text-[#042016] font-semibold'
                : 'border border-[var(--color-line)] text-[var(--color-muted)]',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
        <span className="mx-1 text-[var(--color-line)]">|</span>
        {(['all', 'online', 'degraded', 'offline'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={[
              'rounded-md px-3 py-1.5 text-xs capitalize',
              statusFilter === s
                ? 'bg-white/10 text-white'
                : 'border border-[var(--color-line)] text-[var(--color-muted)]',
            ].join(' ')}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 && <p className="text-sm text-[var(--color-muted)]">No devices match these filters.</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((d) => {
          const Icon = icons[d.type]
          return (
            <article
              key={d.id}
              onClick={() => selectDevice(d.id)}
              className={[
                'cursor-pointer rounded-xl border bg-[var(--color-panel)] p-4',
                selectedDeviceId === d.id
                  ? 'border-[var(--color-mint)]'
                  : 'border-[var(--color-line)]',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-black/30 text-[var(--color-mint)]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{d.name}</div>
                    <div className="text-xs text-[var(--color-muted)] capitalize">
                      {d.type}
                      {d.approach ? ` · ${d.approach}` : ''}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold uppercase ${statusClass(d.status)}`}>
                  {d.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-muted)]">{d.detail}</p>
              <div className="mt-2 font-mono text-[11px] text-[var(--color-muted)]">
                Uptime {d.uptimePct.toFixed(1)}% · HB{' '}
                {new Date(d.lastHeartbeat).toLocaleTimeString()}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleDeviceFault(d.id)
                  }}
                  className="rounded-md border border-[var(--color-line)] px-2 py-1 text-xs text-white hover:bg-white/5"
                >
                  Cycle status
                </button>
                {(['online', 'degraded', 'offline'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeviceStatus(d.id, s)
                    }}
                    className="rounded-md border border-[var(--color-line)] px-2 py-1 text-xs capitalize text-[var(--color-muted)] hover:text-white"
                  >
                    {s}
                  </button>
                ))}
                {d.type === 'camera' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openCamera(d.id)
                    }}
                    className="rounded-md bg-[var(--color-mint)]/20 px-2 py-1 text-xs text-[var(--color-mint)]"
                  >
                    View feed
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
