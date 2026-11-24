import { X } from 'lucide-react'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'

export function CameraModal() {
  const open = useTrafficStore((s) => s.cameraOpen)
  const closeCamera = useTrafficStore((s) => s.closeCamera)
  const devices = useTrafficStore((s) => s.devices)
  const selectedDeviceId = useTrafficStore((s) => s.selectedDeviceId)
  const selectDevice = useTrafficStore((s) => s.selectDevice)
  const activeJunction = useTrafficStore(selectActiveJunction)
  const junctions = useTrafficStore((s) => s.junctions)

  if (!open) return null

  const selectedCamera = devices.find((device) => device.id === selectedDeviceId && device.type === 'camera')
  const junction = junctions.find((item) => item.id === selectedCamera?.junctionId) ?? activeJunction
  const cameras = devices.filter((device) => device.type === 'camera' && device.junctionId === junction.id)
  const active = selectedCamera ?? cameras[0]
  const approach = junction.approaches.find((a) => a.direction === active?.approach)

  return (
    <div role="dialog" aria-modal="true" aria-label="Simulated camera viewer" className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-panel)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">
              {active?.name ?? 'Camera feed'}
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              {junction.name} · Simulated CCTV data
            </div>
          </div>
          <button
            type="button"
            aria-label="Close camera viewer"
            onClick={closeCamera}
            className="rounded-lg border border-[var(--color-line)] p-2 text-[var(--color-muted)] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[180px_1fr]">
          <div className="space-y-1 border-r border-[var(--color-line)] p-3">
            {cameras.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectDevice(c.id)}
                className={[
                  'w-full rounded-lg px-3 py-2 text-left text-xs',
                  c.id === active?.id
                    ? 'bg-[var(--color-mint)]/15 text-[var(--color-mint)]'
                    : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <div className="font-medium">{c.approach}</div>
                <div className="capitalize opacity-80">{c.status}</div>
              </button>
            ))}
          </div>

          <div className="p-4">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-[var(--color-line)] bg-[#071018]">
              <div className="absolute inset-0 map-grid opacity-40" />
              <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(45,212,168,0.08),transparent)]" />
              <div className="absolute top-3 left-3 rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-[var(--color-mint)]">
                REC · SAMPLE
              </div>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">
                    {active?.status === 'offline' ? 'Camera offline' : `${active?.approach} approach view`}
                  </div>
                  {active?.status !== 'offline' && <div className="mt-1 font-mono text-sm text-[var(--color-muted)]">
                    Q {Math.round(approach?.queueLength ?? 0)} ·{' '}
                    {approach?.vehicleCount ?? 0} vehicles · {approach?.phase}
                  </div>}
                </div>
              </div>
              {/* fake cars */}
              {active?.status !== 'offline' && Array.from({ length: Math.min(8, Math.round(approach?.queueLength ?? 0) / 2) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="absolute h-2 w-5 rounded-sm bg-orange-400/80"
                    style={{
                      left: `${18 + i * 9}%`,
                      top: `${42 + (i % 3) * 8}%`,
                    }}
                  />
                ),
              )}
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)]">{active?.detail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
