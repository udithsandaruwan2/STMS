import { Activity, Ambulance, BusFront, Camera, LocateFixed, Minus, Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import { corridors, junctionSites, lanes } from '../data/network'
import { isInFallback, vehiclePosition } from '../lib/networkSimulation'
import { HEAVY_QUEUE, phaseColor } from '../lib/rules'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'
import type { Direction, ScenarioId } from '../types'

const directions: Array<{ direction: Direction; dx: number; dy: number }> = [
  { direction: 'North', dx: 14, dy: -22 },
  { direction: 'South', dx: -14, dy: 22 },
  { direction: 'East', dx: 22, dy: 14 },
  { direction: 'West', dx: -22, dy: -14 },
]

const scenarios: Array<{ id: ScenarioId; label: string }> = [
  { id: 'live', label: 'Typical traffic' },
  { id: 'morning-peak', label: 'Morning peak' },
  { id: 'off-peak', label: 'Off-peak' },
  { id: 'incident', label: 'Lane restriction' },
  { id: 'emergency', label: 'Emergency drill' },
]

const contextRoads = [
  'M145 0 Q101 76 108 155 T116 320 Q113 460 123 640',
  'M0 90 H315 Q376 90 430 57 T650 30 H1120',
  'M130 224 L240 212 H468 L510 195 H1120',
  'M125 273 H265 L342 258 H668 L790 244 H1120',
  'M121 416 H453 L551 390 H1120',
  'M130 478 H464 L524 459 H875 L975 475 H1120',
  'M124 585 H440 L558 611 H1120',
  'M220 0 L230 129 L212 266 L231 405 L224 652',
  'M445 0 L468 130 L452 273 L464 396 L442 653',
  'M572 0 L554 112 L589 254 L568 408 L581 655',
  'M654 52 L638 154 L671 332 L658 526 L692 651',
  'M876 0 L884 148 L875 329 L895 548 L876 650',
  'M994 0 L972 114 L1014 266 L989 405 L1000 655',
]

const blocks = [
  [155, 37, 51, 29], [248, 21, 49, 54], [350, 25, 57, 33], [474, 47, 48, 28],
  [180, 166, 41, 34], [256, 165, 55, 29], [366, 166, 57, 39], [475, 158, 56, 35],
  [165, 240, 37, 23], [245, 229, 71, 30], [368, 225, 55, 25], [478, 219, 69, 24],
  [155, 295, 57, 22], [244, 282, 63, 31], [361, 278, 69, 36], [473, 276, 46, 37],
  [172, 355, 41, 38], [257, 356, 53, 42], [370, 356, 49, 42], [488, 347, 58, 32],
  [162, 437, 50, 28], [247, 435, 53, 34], [363, 434, 63, 31], [477, 420, 56, 30],
  [182, 544, 37, 28], [249, 544, 47, 29], [372, 544, 49, 25], [481, 551, 57, 40],
  [161, 600, 53, 35], [255, 600, 57, 36], [369, 600, 64, 27], [487, 617, 70, 24],
  [776, 44, 74, 48], [913, 34, 54, 35], [1014, 51, 79, 31], [790, 96, 63, 29],
  [782, 162, 73, 38], [904, 166, 50, 39], [1016, 169, 67, 41],
  [782, 262, 67, 44], [913, 257, 63, 51], [1037, 282, 55, 29],
  [790, 352, 66, 25], [913, 351, 55, 33], [1020, 355, 65, 28],
  [787, 402, 73, 43], [911, 418, 56, 34], [1023, 419, 61, 32],
  [797, 479, 63, 28], [921, 485, 48, 25], [1016, 484, 62, 26],
  [792, 549, 68, 35], [919, 552, 45, 25], [1021, 551, 74, 29],
]

const button = 'inline-flex items-center justify-center gap-1.5 rounded-md border border-[#304759] bg-[#111e2c] px-2.5 py-1.5 text-xs text-slate-200 hover:border-teal-400 focus-visible:outline-2 focus-visible:outline-teal-300'

export function JunctionMap() {
  const pattern = useId()
  const junctions = useTrafficStore((state) => state.junctions)
  const junction = useTrafficStore(selectActiveJunction)
  const vehicles = useTrafficStore((state) => state.vehicles)
  const devices = useTrafficStore((state) => state.devices)
  const buses = useTrafficStore((state) => state.buses)
  const incidents = useTrafficStore((state) => state.incidents)
  const scenario = useTrafficStore((state) => state.scenario)
  const setScenario = useTrafficStore((state) => state.setScenario)
  const zoom = useTrafficStore((state) => state.mapZoom)
  const zoomIn = useTrafficStore((state) => state.zoomIn)
  const zoomOut = useTrafficStore((state) => state.zoomOut)
  const resetZoom = useTrafficStore((state) => state.resetZoom)
  const selectJunction = useTrafficStore((state) => state.selectJunction)
  const selectedApproach = useTrafficStore((state) => state.selectedApproach)
  const selectApproach = useTrafficStore((state) => state.selectApproach)
  const selectedBusId = useTrafficStore((state) => state.selectedBusId)
  const selectBus = useTrafficStore((state) => state.selectBus)
  const openCamera = useTrafficStore((state) => state.openCamera)
  const cycleGreen = useTrafficStore((state) => state.cycleGreen)
  const [showFlow, setShowFlow] = useState(true)

  const site = junctionSites.find((entry) => entry.id === junction.id)!
  const bus = buses.find((entry) => entry.id === selectedBusId)
  const gpsDown = (id: string) => devices.some((device) => device.id === `gps-${id}` && device.status === 'offline')
  const fallback = isInFallback(junction.id, devices)
  const selected = junction.approaches.find((entry) => entry.direction === selectedApproach)
  const camera = devices.find((entry) => entry.junctionId === site.id && entry.type === 'camera' && entry.approach === selectedApproach)
  const incident = incidents.find((entry) => entry.id.startsWith('scenario-incident-'))
  const bounds = { width: 1120 / zoom, height: 650 / zoom }
  const left = Math.max(0, Math.min(1120 - bounds.width, site.x - bounds.width / 2))
  const top = Math.max(0, Math.min(650 - bounds.height, site.y - bounds.height / 2))
  const selectSite = selectJunction

  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-[#27384a] bg-[#101a28]" aria-label="Colombo traffic map">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#27384a] px-2.5 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2.5">
          <Activity size={17} className="text-teal-300" />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Colombo traffic map</h2>
            <p className="text-[11px] text-slate-400">Schematic map · 4× demo clock</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Traffic scenario" value={scenario} onChange={(event) => setScenario(event.target.value as ScenarioId)} className={button}>
            {scenarios.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <select aria-label="Focus junction" value={site.id} onChange={(event) => selectSite(event.target.value)} className={button}>
            {junctionSites.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
        </div>
      </div>

      <div className="relative flex h-[clamp(11.5rem,54vw,30rem)] items-center justify-center bg-[#132631] md:h-[min(58vw,calc(100dvh-14rem))] md:min-h-52 [@media(max-height:480px)]:h-[max(8rem,calc(100dvh-12rem))] [@media(max-height:480px)]:min-h-0 [@media(min-width:1280px)_and_(min-height:620px)]:h-auto [@media(min-width:1280px)_and_(min-height:620px)]:min-h-0 [@media(min-width:1280px)_and_(min-height:620px)]:flex-1">
        <svg viewBox={`${left} ${top} ${bounds.width} ${bounds.height}`} preserveAspectRatio="xMidYMid meet" className="block h-full w-full" aria-label="Six signalised Colombo junctions">
          <defs>
            <pattern id={pattern} width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.7" fill="#83aaba" opacity=".24" />
            </pattern>
          </defs>

          <rect width="1120" height="650" fill="#183038" />
          <path d="M0 0H131L104 61 91 119 98 205 81 275 96 384 83 446 101 530 91 589 108 650H0Z" fill="#112937" stroke="#42616a" strokeWidth="2" />
          <path d="M0 0H98L71 72 62 130 68 208 56 281 70 385 61 450 78 532 66 599 81 650H0Z" fill={`url(#${pattern})`} />
          <text transform="translate(42 396) rotate(-90)" fill="#739aaa" fontSize="14" letterSpacing="5">INDIAN OCEAN</text>
          <path d="M605 51 L716 58 716 126 649 126 629 106Z M594 165H716V224L663 241 614 224Z M604 397H714V446L619 445Z M908 595H1090V650H926Z" fill="#203d38" stroke="#39584a" strokeWidth="1.5" />
          <text x="655" y="193" fill="#84a599" fontSize="11" textAnchor="middle">Viharamahadevi Park</text>
          <text x="653" y="420" fill="#84a599" fontSize="11" textAnchor="middle">University grounds</text>
          {blocks.map(([x, y, width, height]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} rx="5" fill="#203b43" stroke="#2d4850" />
          ))}
          <g fill="none" strokeLinecap="round">
            {contextRoads.map((path) => <path key={path} d={path} stroke="#304951" strokeWidth="6" />)}
            {contextRoads.map((path) => <path key={path} d={path} stroke="#3b565c" strokeWidth="1.5" />)}
          </g>
          {corridors.map((road) => {
            const path = road.axis === 'vertical'
              ? `M${road.fixed} ${road.start}V${road.end}`
              : `M${road.start} ${road.fixed}H${road.end}`
            return <path key={road.id} d={path} fill="none" stroke="#527078" strokeWidth="35" strokeLinecap="round" />
          })}
          {corridors.map((road) => {
            const path = road.axis === 'vertical'
              ? `M${road.fixed} ${road.start}V${road.end}`
              : `M${road.start} ${road.fixed}H${road.end}`
            return (
              <g key={road.id} fill="none">
                <path d={path} stroke="#293d48" strokeWidth="30" strokeLinecap="round" />
                <path d={path} stroke="#788789" strokeWidth="1" strokeDasharray="5 7" />
              </g>
            )
          })}
          <g fill="#a2b3bb" fontSize="12" fontWeight="600" letterSpacing="0.5">
            <text x="316" y="94" transform="rotate(-90 316 94)">Galle Road</text>
            <text x="731" y="113" transform="rotate(-90 731 113)">Havelock Road</text>
            <text x="943" y="124" textAnchor="middle">Dharmapala Mawatha</text>
            <text x="943" y="314" textAnchor="middle">Reid Avenue</text>
            <text x="943" y="504" textAnchor="middle">W. A. Silva Mawatha</text>
            <text x="141" y="486" transform="rotate(-90 141 486)">Marine Drive</text>
          </g>
          <g transform="translate(1051 79)" textAnchor="middle" fill="#c5d4dc">
            <text fontSize="11" y="-23">N</text>
            <path d="M0 -15 5 0 0 -4 -5 0Z" fill="#b5c8d1" />
          </g>

          {showFlow && lanes.flatMap((lane) => lane.stops.map((stop) => {
            const local = junctions.find((entry) => entry.id === stop.junctionId)!
            const approach = local.approaches.find((entry) => entry.direction === lane.direction)!
            const before = lane.stops[lane.stops.indexOf(stop) - 1]?.at ?? -23
            const length = Math.min(stop.at - before - 39, approach.queueLength * 11 + 21)
            if (length <= 0) return null
            const a = vehiclePosition({ laneId: lane.id, progress: stop.at })
            const b = vehiclePosition({ laneId: lane.id, progress: stop.at - length })
            const color = approach.queueLength >= HEAVY_QUEUE ? '#f47967' : approach.queueLength >= 4 ? '#efb461' : '#47cbad'
            return <line key={`${lane.id}-${stop.junctionId}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} opacity=".34" strokeWidth="9" strokeLinecap="round" />
          }))}

          {junctionSites.map((entry) => (
            <rect key={entry.id} x={entry.x - 15} y={entry.y - 15} width="30" height="30" fill="#293d48" />
          ))}
          {vehicles.map((vehicle) => {
            const { x, y, rotation } = vehiclePosition(vehicle)
            const busOffline = vehicle.kind === 'bus' && gpsDown(vehicle.id)
            const tracked = (vehicle.kind === 'bus' && !busOffline) || vehicle.kind === 'ambulance'
            const length = vehicle.kind === 'bus' ? 17 : vehicle.kind === 'truck' || vehicle.kind === 'ambulance' ? 13 : 8
            const fill = vehicle.kind === 'ambulance' ? '#ff7672' : vehicle.kind === 'bus' && !busOffline ? '#5bd3fd' : vehicle.color
            const chooseBus = () => selectBus(selectedBusId === vehicle.id ? null : vehicle.id)
            return (
              <g key={vehicle.id} style={{ transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`, transition: vehicle.progress >= vehicle.cruise ? 'transform 250ms linear' : 'none' }}
                role={vehicle.kind === 'bus' ? 'button' : undefined} tabIndex={vehicle.kind === 'bus' ? 0 : undefined}
                aria-label={vehicle.kind === 'bus' ? `Bus ${vehicle.id.split('-')[1]}` : undefined}
                className={vehicle.kind === 'bus' ? 'cursor-pointer' : undefined}
                onClick={vehicle.kind === 'bus' ? chooseBus : undefined}
                onKeyDown={vehicle.kind === 'bus' ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); chooseBus() }
                } : undefined}>
                {tracked && <rect x={-length / 2 - 3} y="-6" width={length + 6} height="12" rx="4" fill={fill} opacity=".24" />}
                <rect x={-length / 2} y={tracked ? -3.5 : -2.5} width={length} height={tracked ? 7 : 5} rx="1.5" fill={fill}
                  stroke={selectedBusId === vehicle.id ? '#fff' : '#132631'} strokeWidth={selectedBusId === vehicle.id ? 1.5 : 0.75} />
                <path d={`M${length / 2 - 2} -1.5v3`} stroke={tracked ? '#113a4b' : '#effaff'} strokeWidth="1.2" />
                {vehicle.kind === 'ambulance' && <path d="M-3 0h6M0 -3v6" stroke="white" strokeWidth="1.4" />}
              </g>
            )
          })}
          {junctionSites.map((entry) => {
            const local = junctions.find((item) => item.id === entry.id)!
            const active = entry.id === site.id
            const fault = isInFallback(entry.id, devices)
            const restricted = incident?.junctionId === entry.id
            const labelWidth = entry.name.length * 8 + 22
            return (
              <g key={entry.id}>
                <g role="button" tabIndex={0} aria-label={`Focus ${entry.name} junction`} aria-pressed={active}
                  className="cursor-pointer" onClick={() => selectSite(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSite(entry.id) }
                  }}>
                  {active && <circle cx={entry.x} cy={entry.y} r="31" fill="none" stroke="#58e1bf" strokeWidth="1.6" strokeDasharray="4 4" />}
                  <circle cx={entry.x} cy={entry.y} r="15" fill="#12252e" stroke={fault || restricted ? '#f9a366' : active ? '#60e5c2' : '#8cabb6'} strokeWidth={active ? 2.5 : 1.4} />
                  <path d={`M${entry.x - 4} ${entry.y}h8m-4 -4v8`} stroke="#e3eef0" strokeWidth="1.5" />
                  <rect x={entry.x + 31} y={entry.y + 19} width={labelWidth} height="23" rx="5" fill={active ? '#174239' : '#132631'} stroke={active ? '#4acfae' : '#44606a'} />
                  <text x={entry.x + 41} y={entry.y + 35} fontSize="13" fontWeight="600" fill={active ? '#a3f6de' : '#dce8eb'}>{entry.name}</text>
                </g>
                {directions.map(({ direction, dx, dy }) => {
                  const approach = local.approaches.find((item) => item.direction === direction)!
                  const focus = () => selectApproach(active && selectedApproach === direction ? null : direction, entry.id)
                  return (
                    <g key={direction} role="button" tabIndex={0} aria-label={`${entry.name} ${direction} signal`}
                      className="cursor-pointer" onClick={focus} onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); focus() }
                      }}>
                      <title>{entry.name} {direction} · {approach.phase} · {approach.queueLength} queued</title>
                      <circle cx={entry.x + dx} cy={entry.y + dy} r="7.5" fill="#10222c"
                        stroke={active && selectedApproach === direction ? '#fff' : '#5b7680'} strokeWidth="1" />
                      <circle cx={entry.x + dx} cy={entry.y + dy} r="4" fill={phaseColor(approach.phase)} />
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>

        <div className="absolute right-2 bottom-2 flex gap-1 sm:right-3 sm:bottom-3 sm:gap-1.5">
          <button type="button" className={button} onClick={zoomOut} disabled={zoom <= 1} aria-label="Zoom out"><Minus size={15} /></button>
          <button type="button" className={button} onClick={resetZoom} aria-label="Reset map zoom"><LocateFixed size={15} /></button>
          <button type="button" className={button} onClick={zoomIn} disabled={zoom >= 2.6} aria-label="Zoom in"><Plus size={15} /></button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#27384a] px-4 py-2.5 text-[11px] text-slate-300">
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={showFlow} onChange={(event) => setShowFlow(event.target.checked)} className="accent-teal-400" /> Queue overlay</label>
        <div className="flex items-center gap-2" aria-label="Queue overlay colors">
          {['Light', 'Building', 'Heavy'].map((label, index) => (
            <span className="flex items-center gap-1" key={label}>
              <span className="h-1.5 w-3 rounded-full" style={{ background: ['#47cbad', '#efb461', '#f47967'][index] }} />{label}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1 text-sky-300"><BusFront size={13} /> Bus</span>
        {scenario === 'emergency' && <span className="flex items-center gap-1 text-red-300"><Ambulance size={13} /> Ambulance</span>}
      </div>

      <div className="shrink-0 border-t border-[#27384a] px-2.5 py-2.5 sm:px-4">
        {bus ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div><strong className="text-sky-300">Bus {bus.routeNo}</strong> <span className="text-slate-300">{bus.label}</span></div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              {gpsDown(bus.id) ? <span>GPS offline</span> : <>
                <span className="capitalize">{bus.status}</span><span>{bus.etaMin} min ETA</span><span>{bus.passengers} passengers</span>
              </>}
              <button type="button" className={button} onClick={() => selectBus(null)} aria-label="Close bus details"><X size={14} /></button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">{site.name}{selected ? ` · ${selected.direction} approach` : ''}</h3>
                <p className="text-[11px] text-slate-400">{fallback ? 'Fixed fallback' : junction.adaptive ? 'Adaptive plan' : 'Fixed plan'} · {junction.signal.phase === 'red' ? 'Pedestrian interval' : `${junction.signal.phase === 'green' ? 'Green' : 'Amber'} phase`} · {junction.signal.remaining}s demo time left</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selected && !fallback && <button type="button" className={button} onClick={() => cycleGreen(selected.direction)}>Next green {selected.greenSeconds === 30 ? '50s' : '30s'}</button>}
                <button type="button" className={button} onClick={() => openCamera(camera?.id)}><Camera size={14} /> Camera</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {junction.approaches.map((approach) => (
                <button type="button" key={approach.id} aria-pressed={selectedApproach === approach.direction}
                  onClick={() => selectApproach(selectedApproach === approach.direction ? null : approach.direction)}
                  className={`min-w-0 rounded-md border px-2.5 py-2 text-left text-xs hover:border-teal-400 ${selectedApproach === approach.direction ? 'border-teal-500/70 bg-teal-950/40' : 'border-[#28394a] bg-[#142231]'}`}>
                  <span className="flex items-center gap-1.5 text-slate-100"><span className="size-2 rounded-full" style={{ background: phaseColor(approach.phase) }} />{approach.direction}<span className="text-[10px] capitalize text-slate-400">{approach.phase}</span></span>
                  <span className="mt-1 block text-[11px] text-slate-300">{approach.queueLength} queued · {approach.speedKmh} km/h</span>
                  <span className="mt-1 block text-[11px] text-slate-400">{approach.avgWaitSec}s wait · {approach.greenSeconds}s green</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
