import { phaseColor } from '../lib/rules'
import { useTrafficStore } from '../store/useTrafficStore'
import type { Direction } from '../types'

const markers: Array<{ dir: Direction; x: number; y: number }> = [
  { dir: 'North', x: 320, y: 110 },
  { dir: 'South', x: 320, y: 410 },
  { dir: 'East', x: 500, y: 260 },
  { dir: 'West', x: 140, y: 260 },
]

export function JunctionMap() {
  const junction = useTrafficStore((s) => s.junction)
  const devices = useTrafficStore((s) => s.devices)
  const buses = useTrafficStore((s) => s.buses)
  const adaptiveMode = useTrafficStore((s) => s.adaptiveMode)
  const mapZoom = useTrafficStore((s) => s.mapZoom)
  const selectedApproach = useTrafficStore((s) => s.selectedApproach)
  const selectedBusId = useTrafficStore((s) => s.selectedBusId)
  const zoomIn = useTrafficStore((s) => s.zoomIn)
  const zoomOut = useTrafficStore((s) => s.zoomOut)
  const selectApproach = useTrafficStore((s) => s.selectApproach)
  const selectBus = useTrafficStore((s) => s.selectBus)
  const openCamera = useTrafficStore((s) => s.openCamera)
  const cycleGreen = useTrafficStore((s) => s.cycleGreen)
  const setApproachPhase = useTrafficStore((s) => s.setApproachPhase)

  const byDir = Object.fromEntries(
    junction.approaches.map((a) => [a.direction, a]),
  )
  const selected = selectedApproach ? byDir[selectedApproach] : null
  const selectedBus = buses.find((b) => b.id === selectedBusId)

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-xl border border-[var(--color-line)] bg-[#0d1628] map-grid">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,168,0.08),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(249,115,22,0.08),transparent_40%)]" />

      <div className="absolute top-4 left-4 z-10 rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 backdrop-blur">
        <div className="text-[11px] tracking-wide text-[var(--color-muted)] uppercase">
          Pilot junction
        </div>
        <div className="text-sm font-semibold text-white">{junction.name}</div>
        <div className="font-mono text-[11px] text-[var(--color-muted)]">
          {junction.lat.toFixed(6)}, {junction.lng.toFixed(6)} · zoom {mapZoom.toFixed(2)}x
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => openCamera()}
          className="rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-xs text-white backdrop-blur hover:border-[var(--color-mint)]"
        >
          Open cameras
        </button>
        <div className="rounded-lg border border-[var(--color-line)] bg-black/40 px-3 py-2 text-xs backdrop-blur">
          <span
            className={
              adaptiveMode ? 'text-[var(--color-mint)]' : 'text-[var(--color-amber)]'
            }
          >
            {adaptiveMode ? 'Adaptive timing ON' : 'Fixed timing plan'}
          </span>
        </div>
      </div>

      <div
        className="relative z-[1] flex h-full items-center justify-center transition-transform duration-200"
        style={{ transform: `scale(${mapZoom})` }}
      >
        <svg viewBox="0 0 640 520" className="h-full w-full">
          <rect x="40" y="40" width="160" height="120" rx="8" fill="#152038" />
          <rect x="440" y="40" width="160" height="120" rx="8" fill="#152038" />
          <rect x="40" y="360" width="160" height="120" rx="8" fill="#152038" />
          <rect x="440" y="360" width="160" height="120" rx="8" fill="#152038" />

          <rect x="270" y="0" width="100" height="520" fill="#1b2438" />
          <rect x="0" y="210" width="640" height="100" fill="#1b2438" />
          <rect x="300" y="0" width="4" height="520" fill="#f97316" opacity="0.55" />
          <rect x="336" y="0" width="4" height="520" fill="#f97316" opacity="0.55" />
          <rect x="0" y="240" width="640" height="4" fill="#38bdf8" opacity="0.35" />
          <rect x="0" y="276" width="640" height="4" fill="#38bdf8" opacity="0.35" />

          <rect
            x="255"
            y="195"
            width="130"
            height="130"
            rx="10"
            fill="#10192b"
            stroke="#2dd4a8"
            strokeWidth="2"
            opacity="0.9"
          />
          <text
            x="320"
            y="262"
            textAnchor="middle"
            fill="#2dd4a8"
            fontSize="12"
            fontFamily="IBM Plex Sans"
          >
            SC-01
          </text>

          {markers.map(({ dir, x, y }) => {
            const a = byDir[dir]
            const device = devices.find((d) => d.approach === dir && d.type === 'camera')
            const statusFill =
              device?.status === 'offline'
                ? '#f04343'
                : device?.status === 'degraded'
                  ? '#f5a524'
                  : '#2dd4a8'
            const selectedRing = selectedApproach === dir
            return (
              <g
                key={dir}
                className="cursor-pointer"
                onClick={() =>
                  selectApproach(selectedApproach === dir ? null : dir)
                }
              >
                {selectedRing && (
                  <circle
                    cx={x}
                    cy={y}
                    r="26"
                    fill="none"
                    stroke="#2dd4a8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="#0b1220"
                  stroke={statusFill}
                  strokeWidth="3"
                />
                <circle cx={x} cy={y} r="6" fill={phaseColor(a.phase)} />
                <text
                  x={x}
                  y={y - 28}
                  textAnchor="middle"
                  fill="#e8eefc"
                  fontSize="12"
                  fontFamily="IBM Plex Sans"
                >
                  {dir}
                </text>
                <text
                  x={x}
                  y={y + 36}
                  textAnchor="middle"
                  fill="#8b9bb8"
                  fontSize="11"
                  fontFamily="IBM Plex Mono"
                >
                  Q {Math.round(a.queueLength)} · {a.greenSeconds}s
                </text>
              </g>
            )
          })}

          {buses.map((b) => (
            <g
              key={b.id}
              className="cursor-pointer"
              onClick={() => selectBus(selectedBusId === b.id ? null : b.id)}
            >
              <circle
                cx={b.x}
                cy={b.y}
                r={selectedBusId === b.id ? 11 : 8}
                fill="#38bdf8"
                stroke={selectedBusId === b.id ? '#fff' : 'transparent'}
                strokeWidth="2"
              />
              <text x={b.x + 12} y={b.y + 4} fill="#8b9bb8" fontSize="10">
                Bus {b.routeNo}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {(selected || selectedBus) && (
        <div className="absolute bottom-4 left-4 z-10 w-[min(100%,320px)] rounded-xl border border-[var(--color-line)] bg-black/70 p-3 backdrop-blur">
          {selected && (
            <>
              <div className="text-sm font-semibold text-white">
                {selected.direction} approach
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
                <div>
                  Queue:{' '}
                  <span className="font-mono text-white">
                    {Math.round(selected.queueLength)}
                  </span>
                </div>
                <div>
                  Wait:{' '}
                  <span className="font-mono text-white">{selected.avgWaitSec}s</span>
                </div>
                <div>
                  Speed:{' '}
                  <span className="font-mono text-white">{selected.speedKmh} km/h</span>
                </div>
                <div>
                  Peds:{' '}
                  <span className="font-mono text-white">
                    {selected.pedestrianWaiting}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(['green', 'amber', 'red'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setApproachPhase(selected.direction, p)}
                    className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] capitalize text-white hover:bg-white/10"
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => cycleGreen(selected.direction)}
                  className="rounded-md bg-[var(--color-mint)] px-2 py-1 text-[11px] font-semibold text-[#042016]"
                >
                  Toggle 30/50s
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const cam = devices.find(
                      (d) => d.approach === selected.direction && d.type === 'camera',
                    )
                    openCamera(cam?.id)
                  }}
                  className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-white hover:bg-white/10"
                >
                  Camera
                </button>
              </div>
            </>
          )}
          {selectedBus && (
            <>
              <div className="text-sm font-semibold text-white">
                Bus {selectedBus.routeNo}
              </div>
              <div className="mt-1 text-xs text-[var(--color-muted)]">
                {selectedBus.label}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--color-muted)]">
                <div>
                  ETA:{' '}
                  <span className="font-mono text-white">{selectedBus.etaMin} min</span>
                </div>
                <div>
                  Pax:{' '}
                  <span className="font-mono text-white">
                    {selectedBus.passengers}
                  </span>
                </div>
                <div className="col-span-2 capitalize">
                  Status:{' '}
                  <span className="text-white">{selectedBus.status}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={zoomIn}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-line)] bg-black/50 text-white hover:border-[var(--color-mint)]"
        >
          +
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-line)] bg-black/50 text-white hover:border-[var(--color-mint)]"
        >
          −
        </button>
      </div>
    </div>
  )
}
