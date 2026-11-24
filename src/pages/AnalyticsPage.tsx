import { useMemo, useState } from 'react'
import { junctionSites } from '../data/network'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'

export function AnalyticsPage() {
  const hourlyStats = useTrafficStore((s) => s.hourlyStats)
  const junction = useTrafficStore(selectActiveJunction)
  const junctions = useTrafficStore((state) => state.junctions)
  const incidents = useTrafficStore((s) => s.incidents)
  const recommendations = useTrafficStore((s) => s.recommendations)
  const [range, setRange] = useState<'all' | 'peak' | 'evening'>('all')
  const [exported, setExported] = useState(false)

  const filtered = useMemo(() => {
    if (range === 'peak') return hourlyStats.filter((h) => h.hour >= '07:00' && h.hour <= '09:00')
    if (range === 'evening')
      return hourlyStats.filter((h) => h.hour >= '16:00' && h.hour <= '19:00')
    return hourlyStats
  }, [hourlyStats, range])

  const peak = hourlyStats.reduce((a, b) => (a.volume > b.volume ? a : b))
  const avgFixed =
    filtered.reduce((sum, h) => sum + h.avgWaitSec, 0) / Math.max(filtered.length, 1)
  const avgAdaptive =
    filtered.reduce((sum, h) => sum + h.adaptiveWaitSec, 0) / Math.max(filtered.length, 1)

  const approachBars = junction.approaches.map((a) => ({
    name: a.direction,
    queue: Math.round(a.queueLength),
    wait: a.avgWaitSec,
    speed: a.speedKmh,
  }))

  const networkQueues = junctions.map((local) => ({
    name: junctionSites.find((site) => site.id === local.id)!.name,
    queued: local.approaches.reduce((total, approach) => total + approach.queueLength, 0),
    detected: local.approaches.reduce((total, approach) => total + approach.vehicleCount, 0),
  }))

  const exportReport = () => {
    const payload = {
      junction: junction.name,
      generatedAt: new Date().toISOString(),
      range,
      kpis: {
        peakHour: peak.hour,
        peakVolume: peak.volume,
        avgFixedWait: avgFixed,
        avgAdaptiveWait: avgAdaptive,
        openIncidents: incidents.filter((i) => !i.acknowledged).length,
        approvedRecs: recommendations.filter((r) => r.status === 'approved').length,
      },
      hourly: filtered,
      liveApproaches: approachBars,
      liveNetwork: networkQueues,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stms-pilot-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 2500)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Pilot analytics</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Live demo metrics for {junction.name} and sample hourly history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'Full day'],
            ['peak', 'Morning peak'],
            ['evening', 'Evening'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRange(id)}
              className={[
                'rounded-md px-3 py-1.5 text-xs',
                range === id
                  ? 'bg-[var(--color-mint)] text-[#042016] font-semibold'
                  : 'border border-[var(--color-line)] text-[var(--color-muted)]',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={exportReport}
            className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs text-white hover:bg-white/5"
          >
            {exported ? 'Exported ✓' : 'Export JSON report'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: 'Peak hour volume', value: `${peak.volume} @ ${peak.hour}` },
          { label: 'Avg wait (fixed)', value: `${avgFixed.toFixed(0)}s` },
          { label: 'Avg wait (adaptive est.)', value: `${avgAdaptive.toFixed(0)}s` },
          {
            label: 'Open incidents',
            value: `${incidents.filter((i) => !i.acknowledged).length}`,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
          >
            <div className="text-xs text-[var(--color-muted)]">{k.label}</div>
            <div className="mt-1 font-mono text-2xl text-white">{k.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Live network queues</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {networkQueues.map((row) => (
            <div key={row.name} className="rounded-md bg-black/25 p-2.5">
              <div className="text-xs text-slate-300">{row.name}</div>
              <div className="mt-1 font-mono text-sm text-white">{row.queued} queued</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Sample hourly vehicle volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4a8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#2dd4a8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#243049" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#8b9bb8" fontSize={11} />
                <YAxis stroke="#8b9bb8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#121a2b',
                    border: '1px solid #243049',
                    borderRadius: 8,
                  }}
                />
                <Area type="monotone" dataKey="volume" stroke="#2dd4a8" fill="url(#vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">
            Sample wait time · fixed vs adaptive
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filtered}>
                <CartesianGrid stroke="#243049" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#8b9bb8" fontSize={11} />
                <YAxis stroke="#8b9bb8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#121a2b',
                    border: '1px solid #243049',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgWaitSec"
                  name="Fixed plan"
                  stroke="#f5a524"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="adaptiveWaitSec"
                  name="Adaptive estimate"
                  stroke="#2dd4a8"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Live approach comparison</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approachBars}>
                <CartesianGrid stroke="#243049" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#8b9bb8" fontSize={11} />
                <YAxis stroke="#8b9bb8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#121a2b',
                    border: '1px solid #243049',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="queue" name="Queue" fill="#f97316" radius={4} />
                <Bar dataKey="wait" name="Wait (s)" fill="#38bdf8" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-white">Sample incident counts by hour</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filtered}>
                <CartesianGrid stroke="#243049" strokeDasharray="3 3" />
                <XAxis dataKey="hour" stroke="#8b9bb8" fontSize={11} />
                <YAxis stroke="#8b9bb8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: '#121a2b',
                    border: '1px solid #243049',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="incidents" name="Incidents" fill="#f04343" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
