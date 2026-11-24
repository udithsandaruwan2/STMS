import { Activity, CarFront, ChevronDown, Map, RadioTower, TrafficCone } from 'lucide-react'
import { useRef } from 'react'
import { EquipmentPanel } from '../components/EquipmentPanel'
import { JunctionMap } from '../components/JunctionMap'
import { NotificationPanel } from '../components/NotificationPanel'
import { isInFallback } from '../lib/networkSimulation'
import { useTrafficStore } from '../store/useTrafficStore'

export function MonitorPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLElement>(null)
  const devices = useTrafficStore((state) => state.devices)
  const junctions = useTrafficStore((state) => state.junctions)
  const vehicleCount = useTrafficStore((state) => state.vehicles.length)
  const activityLog = useTrafficStore((state) => state.activityLog)
  const simPaused = useTrafficStore((state) => state.simPaused)
  const faultSites = junctions.filter((junction) => isInFallback(junction.id, devices))
  const queued = junctions.reduce((total, junction) =>
    total + junction.approaches.reduce((sum, approach) => sum + approach.queueLength, 0), 0)

  const stats = [
    { label: 'Signalised junctions', value: junctions.length, Icon: RadioTower },
    { label: 'Vehicles on network', value: vehicleCount, Icon: CarFront },
    { label: 'Vehicles queued', value: queued, Icon: TrafficCone },
    { label: 'Junctions on fallback', value: faultSites.length, Icon: Activity },
  ]

  return (
    <div ref={pageRef} className="mx-auto flex max-w-[2000px] flex-col gap-3 px-2.5 pb-3 sm:gap-4 sm:px-4 sm:pb-4">
      <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#27384a] bg-[var(--color-shell)] py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-base font-semibold text-white sm:text-lg">Colombo network monitor</h1>
          <span className={`flex items-center gap-1.5 text-[11px] ${simPaused ? 'text-amber-200' : 'text-teal-200'}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {simPaused ? 'Paused' : 'Demo running'}
          </span>
        </div>
        <nav aria-label="Monitor sections" className="flex items-center gap-1.5 text-xs">
          <button type="button" onClick={() => pageRef.current?.scrollIntoView({ block: 'start' })}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#304759] px-2 py-1.5 text-slate-200 hover:border-teal-400">
            <Map size={14} /> Map overview
          </button>
          <button type="button" onClick={() => detailsRef.current?.scrollIntoView({ block: 'start' })}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#304759] px-2 py-1.5 text-slate-200 hover:border-teal-400">
            <ChevronDown size={14} /> Equipment & activity
          </button>
        </nav>
      </header>

      <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[minmax(0,1fr)_290px] xl:items-stretch [@media(min-width:1280px)_and_(min-height:620px)]:h-[calc(100dvh-8.5rem)]">
        <JunctionMap />

        <aside aria-label="Network status and notifications" className="flex min-h-0 min-w-0 flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-2">
              {stats.map(({ label, value, Icon }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg border border-[#27384a] bg-[#101a28] px-2.5 py-2">
                  <div className="hidden rounded-md bg-teal-400/10 p-2 text-teal-300 md:block xl:hidden"><Icon size={17} /></div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">{label}</div>
                    <div className="font-mono text-base leading-tight text-white">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          {faultSites.length > 0 && (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-100">
              Fixed fallback active at {faultSites.map((junction) => junction.name.split(' / ')[0]).join(', ')}.
            </p>
          )}
          <div className="h-80 min-h-0 [@media(min-width:1280px)_and_(min-height:620px)]:h-auto [@media(min-width:1280px)_and_(min-height:620px)]:flex-1">
            <NotificationPanel />
          </div>
        </aside>
      </div>

      <section ref={detailsRef} aria-label="Equipment and activity" className="grid min-w-0 scroll-mt-24 items-start gap-4 sm:scroll-mt-16 xl:grid-cols-[minmax(0,1fr)_290px]">
        <EquipmentPanel />
        <section className="glass max-h-56 overflow-auto rounded-xl p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Activity log</h2>
          <ul className="space-y-2.5">
            {activityLog.slice(0, 8).map((entry) => (
              <li key={entry.id} className="text-xs text-slate-400">
                <span className="mr-1.5 font-mono text-[10px] text-teal-200">{new Date(entry.time).toLocaleTimeString()}</span>
                {entry.action}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  )
}
