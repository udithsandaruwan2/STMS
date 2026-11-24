import { Bell, Pause, Play, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { junctionSites } from '../data/network'
import { useNavigate } from 'react-router-dom'
import { selectActiveJunction, useTrafficStore } from '../store/useTrafficStore'

export function TopBar({ title }: { title: string }) {
  const navigate = useNavigate()
  const operatorName = useTrafficStore((s) => s.operatorName)
  const pending = useTrafficStore(
    (s) => s.recommendations.filter((r) => r.status === 'pending').length,
  )
  const unacked = useTrafficStore(
    (s) => s.incidents.filter((i) => !i.acknowledged).length,
  )
  const junction = useTrafficStore(selectActiveJunction)
  const devices = useTrafficStore((s) => s.devices)
  const incidents = useTrafficStore((s) => s.incidents)
  const searchQuery = useTrafficStore((s) => s.searchQuery)
  const setSearchQuery = useTrafficStore((s) => s.setSearchQuery)
  const toggleNotifOpen = useTrafficStore((s) => s.toggleNotifOpen)
  const selectJunction = useTrafficStore((s) => s.selectJunction)
  const selectApproach = useTrafficStore((s) => s.selectApproach)
  const selectDevice = useTrafficStore((s) => s.selectDevice)
  const openCamera = useTrafficStore((s) => s.openCamera)
  const simPaused = useTrafficStore((s) => s.simPaused)
  const setSimPaused = useTrafficStore((s) => s.setSimPaused)
  const [focused, setFocused] = useState(false)

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const hits: Array<{ label: string; hint: string; run: () => void }> = []

    for (const site of junctionSites) {
      if (`${site.name} ${site.road}`.toLowerCase().includes(q)) {
        hits.push({
          label: site.name,
          hint: site.road,
          run: () => { selectJunction(site.id); navigate('/'); setSearchQuery('') },
        })
      }
    }
    for (const a of junction.approaches) {
      if (a.direction.toLowerCase().includes(q) || `queue ${a.direction.toLowerCase()}`.includes(q)) {
        hits.push({
          label: `${a.direction} approach`,
          hint: `Q ${Math.round(a.queueLength)} · ${a.phase}`,
          run: () => {
            selectApproach(a.direction)
            navigate('/')
            setSearchQuery('')
          },
        })
      }
    }
    for (const d of devices) {
      if (
        d.name.toLowerCase().includes(q) ||
        d.type.includes(q) ||
        d.id.includes(q)
      ) {
        hits.push({
          label: d.name,
          hint: `${d.type} · ${d.status}`,
          run: () => {
            selectDevice(d.id)
            if (d.type === 'camera') openCamera(d.id)
            else navigate('/faults')
            setSearchQuery('')
          },
        })
      }
    }
    for (const i of incidents) {
      if (i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) {
        hits.push({
          label: i.title,
          hint: i.severity,
          run: () => {
            toggleNotifOpen()
            setSearchQuery('')
            navigate('/')
          },
        })
      }
    }

    const commands = [
      {
        key: 'control',
        label: 'Open Control',
        hint: 'AI recommendations',
        run: () => navigate('/control'),
      },
      {
        key: 'analytics',
        label: 'Open Analytics',
        hint: 'Charts & trends',
        run: () => navigate('/analytics'),
      },
      {
        key: 'driver',
        label: 'Open Driver alerts',
        hint: 'Public route view',
        run: () => navigate('/driver'),
      },
      {
        key: 'camera',
        label: 'Open cameras',
        hint: 'CCTV sample viewer',
        run: () => openCamera(),
      },
      {
        key: 'peak',
        label: 'Morning peak scenario',
        hint: 'Load heavy queues',
        run: () => useTrafficStore.getState().setScenario('morning-peak'),
      },
    ]
    for (const c of commands) {
      if (c.key.includes(q) || c.label.toLowerCase().includes(q)) {
        hits.push({
          label: c.label,
          hint: c.hint,
          run: () => {
            c.run()
            setSearchQuery('')
          },
        })
      }
    }
    return hits.slice(0, 8)
  }, [
    searchQuery,
    junction.approaches,
    devices,
    incidents,
    navigate,
    selectApproach,
    selectJunction,
    selectDevice,
    openCamera,
    setSearchQuery,
    toggleNotifOpen,
  ])

  return (
    <header className="relative z-40 flex h-14 items-center gap-2 border-b border-[var(--color-line)] bg-[#0a1322] px-2 sm:gap-4 sm:px-5">
      <div className="hidden shrink-0 text-sm sm:block font-medium text-white">{title}</div>

      <div className="relative mx-auto w-full max-w-xl">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] py-2 pr-3 pl-9 text-sm text-white outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-mint)]"
          placeholder="Search junctions, devices, incidents…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {focused && (searchQuery.trim() || results.length > 0) && (
          <div className="absolute top-full right-0 left-0 mt-1 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] shadow-2xl">
            {results.length === 0 ? (
              <div className="px-3 py-3 text-xs text-[var(--color-muted)]">
                Try “north”, “camera”, “control”, or “peak”
              </div>
            ) : (
              results.map((r) => (
                <button
                  key={r.label + r.hint}
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={r.run}
                >
                  <span className="text-white">{r.label}</span>
                  <span className="text-xs text-[var(--color-muted)]">{r.hint}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {title !== 'Monitor' && title !== 'Faults' && title !== 'System' && (
          <select aria-label="Active junction" value={junction.id} onChange={(event) => selectJunction(event.target.value)}
            className="max-w-24 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-2 text-xs text-white sm:max-w-none">
            {junctionSites.map((site) => <option value={site.id} key={site.id}>{site.name}</option>)}
          </select>
        )}
        <button
          type="button"
          onClick={() => setSimPaused(!simPaused)}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-2.5 py-2 text-xs text-[var(--color-muted)] hover:text-white"
          title={simPaused ? 'Resume simulation' : 'Pause simulation'}
        >
          {simPaused ? <Play size={14} /> : <Pause size={14} />}
          <span className="hidden sm:inline">{simPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          type="button"
          onClick={toggleNotifOpen}
          className="relative rounded-lg border border-[var(--color-line)] p-2 text-[var(--color-muted)] hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {(pending > 0 || unacked > 0) && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] text-white">
              {pending + unacked}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 py-1.5 lg:flex">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--color-mint-dim)] text-xs font-semibold text-white">
            RR
          </div>
          <div className="text-xs">
            <div className="font-medium text-white">{operatorName}</div>
            <div className="text-[var(--color-muted)]">Traffic Operator</div>
          </div>
        </div>
      </div>
    </header>
  )
}
