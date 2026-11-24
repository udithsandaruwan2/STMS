import { create } from 'zustand'
import { seedBuses } from '../data/buses'
import { equipmentStatsSeed, hourlyStats } from '../data/history'
import { seedIncidents } from '../data/incidents'
import { junctionSites, networkDevices, pilotId } from '../data/network'
import {
  SIM_INTERVAL_MS, advanceSignal, advanceVehicles, applySignal, createVehicles,
  initialJunctions, isInFallback, emergencyJunction, measureJunctions, vehiclePosition, withGreen, withAxisTiming,
  type LiveJunction, type Vehicle,
} from '../lib/networkSimulation'
import { seedRoutes } from '../data/routes'
import {
  buildRecommendation,
  shouldSuggestHeavyGreen,
} from '../lib/rules'
import type {
  ActivityLog,
  AlternateRoute,
  BusTrack,
  Device,
  DeviceStatus,
  Direction,
  HourlyStat,
  Incident,
  Recommendation,
  RecommendationStatus,
  ScenarioId,
  SignalPhase,
} from '../types'

interface TrafficState {
  junctions: LiveJunction[]
  activeJunctionId: string
  vehicles: Vehicle[]
  devices: Device[]
  incidents: Incident[]
  recommendations: Recommendation[]
  hourlyStats: HourlyStat[]
  equipmentStats: typeof equipmentStatsSeed
  routes: AlternateRoute[]
  buses: BusTrack[]
  activityLog: ActivityLog[]
  simRunning: boolean
  simPaused: boolean
  tick: number
  mapZoom: number
  scenario: ScenarioId
  searchQuery: string
  notifOpen: boolean
  selectedApproach: Direction | null
  selectedDeviceId: string | null
  selectedBusId: string | null
  selectedRouteId: string | null
  cameraOpen: boolean
  operatorName: string
  toast: string | null

  startSimulator: () => () => void
  setSimPaused: (paused: boolean) => void
  setAdaptiveMode: (value: boolean) => void
  setScenario: (scenario: ScenarioId) => void
  setSearchQuery: (q: string) => void
  setNotifOpen: (open: boolean) => void
  toggleNotifOpen: () => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  selectJunction: (id: string) => void
  selectApproach: (dir: Direction | null, junctionId?: string) => void
  selectDevice: (id: string | null) => void
  selectBus: (id: string | null) => void
  selectRoute: (id: string | null) => void
  openCamera: (deviceId?: string) => void
  closeCamera: () => void
  setApproachPhase: (dir: Direction, phase: SignalPhase) => void
  setApproachGreen: (dir: Direction, seconds: number) => void
  cycleGreen: (dir: Direction) => void
  reviewRecommendation: (
    id: string,
    status: Exclude<RecommendationStatus, 'pending'>,
    note: string,
  ) => void
  requestAiSuggestion: (dir?: Direction) => void
  toggleDeviceFault: (id: string) => void
  setDeviceStatus: (id: string, status: DeviceStatus) => void
  restoreAllDevices: () => void
  acknowledgeIncident: (id: string) => void
  dismissIncident: (id: string) => void
  injectIncident: (partial?: Partial<Incident>) => void
  clearToast: () => void
  pushLog: (action: string) => void
}

export const selectActiveJunction = (state: TrafficState) =>
  state.junctions.find((junction) => junction.id === state.activeJunctionId)!

const initialVehicles = createVehicles('live')
const initialNetwork = measureJunctions(initialJunctions(), initialVehicles)

function updateJunction(junctions: LiveJunction[], id: string, update: (junction: LiveJunction) => LiveJunction) {
  return junctions.map((junction) => junction.id === id ? update(junction) : junction)
}

function fixedPlan(junction: LiveJunction): LiveJunction {
  return {
    ...junction,
    adaptive: false,
    signal: junction.signal.phase === 'green'
      ? { ...junction.signal, next: undefined, remaining: Math.min(junction.signal.remaining, junction.normalGreenSec) }
      : { ...junction.signal, next: undefined },
    approaches: junction.approaches.map((approach) => withGreen(approach, junction.normalGreenSec)),
  }
}

function updateBuses(vehicles: Vehicle[]) {
  return seedBuses.map((bus): BusTrack => {
    const vehicle = vehicles.find((item) => item.id === bus.id)
    if (!vehicle) return bus
    const stopped = vehicle.speed < 0.75
    return {
      ...bus,
      ...vehiclePosition(vehicle),
      status: stopped ? 'delayed' : 'on-time',
      etaMin: Math.max(2, Math.round(bus.etaMin + (stopped ? 3 : 0) - vehicle.progress / 260)),
    }
  })
}

function updateRoutes(junctions: LiveJunction[]) {
  const groups = [
    ['kollupitiya', 'wellawatte'],
    [pilotId, 'thummulla'],
    ['town-hall', 'havelock'],
    ['kollupitiya', pilotId, 'wellawatte'],
  ]
  return seedRoutes.map((route, index): AlternateRoute => {
    const sites = junctions.filter((junction) => groups[index].includes(junction.id))
    const queue = sites.reduce((sum, junction) =>
      sum + Math.max(...junction.approaches.map((approach) => approach.queueLength)), 0) / sites.length
    const crowd = queue >= 9 ? 'Heavy' : queue >= 5 ? 'Medium' : 'Light'
    return {
      ...route,
      etaMin: Math.round(route.distanceKm * 2.5 + queue * 0.85),
      crowd,
      status: crowd === 'Heavy' ? 'congested' : crowd === 'Light' && index === 0 ? 'recommended' : 'open',
    }
  })
}

function nowLog(action: string, actor = 'R. Rathnayaka'): ActivityLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toISOString(),
    actor,
    action,
  }
}

let simTimer: ReturnType<typeof setInterval> | null = null

export const useTrafficStore = create<TrafficState>((set, get) => ({
  junctions: initialNetwork,
  activeJunctionId: pilotId,
  vehicles: initialVehicles,
  devices: structuredClone(networkDevices),
  incidents: seedIncidents.map((incident) => ({ ...incident, junctionId: pilotId })),
  recommendations: [
    {
      id: 'rec-seed-1',
      junctionId: pilotId,
      approach: 'North',
      fromSec: 30,
      toSec: 50,
      queueLength: initialNetwork.find((junction) => junction.id === pilotId)!.approaches[0].queueLength,
      reason:
        'Sample recommendation for the Galle Road North approach. Extend the next green window while keeping pedestrian protection unchanged.',
      status: 'pending',
      createdAt: new Date(Date.now() - 45000).toISOString(),
      confidence: 86,
    },
  ],
  hourlyStats,
  equipmentStats: equipmentStatsSeed,
  routes: updateRoutes(initialNetwork),
  buses: updateBuses(initialVehicles),
  activityLog: [
    nowLog('Pilot dashboard session started', 'System'),
    nowLog('Loaded six Colombo demo junctions', 'System'),
  ],
  simRunning: false,
  simPaused: false,
  tick: 0,
  mapZoom: 1,
  scenario: 'live',
  searchQuery: '',
  notifOpen: false,
  selectedApproach: null,
  selectedDeviceId: null,
  selectedBusId: null,
  selectedRouteId: null,
  cameraOpen: false,
  operatorName: 'R. Rathnayaka',
  toast: null,

  clearToast: () => set({ toast: null }),

  pushLog: (action) =>
    set((s) => ({
      activityLog: [nowLog(action), ...s.activityLog].slice(0, 40),
    })),

  setSimPaused: (paused) => {
    set({ simPaused: paused, toast: paused ? 'Simulation paused' : 'Simulation resumed' })
    get().pushLog(paused ? 'Paused live simulation' : 'Resumed live simulation')
  },

  setAdaptiveMode: (value) => {
    const state = get()
    const junction = selectActiveJunction(state)
    if (value && isInFallback(junction.id, state.devices)) {
      set({ toast: 'Restore local devices before enabling adaptive timing' })
      return
    }
    set({
      junctions: updateJunction(state.junctions, junction.id, (local) =>
        value ? { ...local, adaptive: true } : fixedPlan(local)),
      toast: value ? 'Adaptive plan enabled for reviewed timings' : 'Fixed timing restored',
    })
    get().pushLog(`${junction.name}: ${value ? 'enabled adaptive plan' : 'restored fixed plan'}`)
  },

  setScenario: (scenario) => {
    const state = get()
    const vehicles = createVehicles(scenario)
    const junctions = measureJunctions(initialJunctions(), vehicles)
    const scenarioSite = scenario === 'incident' ? 'thummulla' : pilotId
    const extra: Incident[] = scenario === 'incident' || scenario === 'emergency' ? [{
      id: `scenario-${scenario}-${Date.now()}`,
      junctionId: scenarioSite,
      severity: scenario === 'incident' ? 'high' : 'critical',
      category: scenario === 'incident' ? 'Incident' : 'Emergency',
      title: scenario === 'incident' ? 'Lane restriction at Thummulla' : 'Ambulance priority drill',
      message: scenario === 'incident'
        ? 'Eastbound traffic is slowed on the West approach. Dismiss this event to clear the restriction.'
        : 'The ambulance follows Galle Road northbound. Signals give its approach priority after the current phase clears.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      approach: scenario === 'incident' ? 'West' : 'South',
    }] : []
    set({
      scenario,
      junctions,
      vehicles,
      buses: updateBuses(vehicles),
      routes: updateRoutes(junctions),
      activeJunctionId: extra.length ? scenarioSite : state.activeJunctionId,
      selectedApproach: null,
      selectedBusId: null,
      recommendations: state.recommendations.filter((item) => item.status !== 'pending'),
      incidents: [...extra, ...state.incidents.filter((item) => !item.id.startsWith('scenario-'))].slice(0, 24),
      toast: `Scenario loaded: ${scenario}`,
    })
    get().pushLog(`Applied network scenario “${scenario}”`)
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  setNotifOpen: (open) => set({ notifOpen: open }),
  toggleNotifOpen: () => set((s) => ({ notifOpen: !s.notifOpen })),

  zoomIn: () => set((s) => ({ mapZoom: Math.min(2.6, +(s.mapZoom + 0.4).toFixed(2)) })),
  zoomOut: () => set((s) => ({ mapZoom: Math.max(1, +(s.mapZoom - 0.4).toFixed(2)) })),

  resetZoom: () => set({ mapZoom: 1 }),

  selectJunction: (id) => {
    if (get().junctions.some((junction) => junction.id === id)) {
      set({ activeJunctionId: id, selectedApproach: null, selectedBusId: null })
    }
  },
  selectApproach: (dir, junctionId) => {
    if (junctionId && !get().junctions.some((junction) => junction.id === junctionId)) return
    set((state) => ({
      activeJunctionId: junctionId ?? state.activeJunctionId,
      selectedApproach: dir,
      selectedBusId: null,
    }))
  },
  selectDevice: (id) => set({ selectedDeviceId: id }),
  selectBus: (id) => set({ selectedBusId: id, selectedApproach: null }),
  selectRoute: (id) => {
    set({ selectedRouteId: id, toast: id ? 'Alternate route selected' : null })
    if (id) {
      const route = get().routes.find((r) => r.id === id)
      get().pushLog(`Driver selected route: ${route?.name ?? id}`)
    }
  },

  openCamera: (deviceId) => {
    const cameras = get().devices.filter((d) => d.type === 'camera' && d.junctionId === get().activeJunctionId)
    const id = deviceId ?? cameras[0]?.id ?? null
    set({ cameraOpen: true, selectedDeviceId: id, toast: 'Camera viewer opened' })
    get().pushLog(`Opened camera feed ${id ?? ''}`)
  },
  closeCamera: () => set({ cameraOpen: false }),

  setApproachPhase: (dir, phase) => {
    const state = get()
    const junction = selectActiveJunction(state)
    if (isInFallback(junction.id, state.devices)) {
      set({ toast: 'Manual phases are unavailable during local fallback' })
      return
    }
    const current = junction.signal
    const next = { direction: dir, phase }
    const signal = current.phase === 'green'
      ? { ...current, phase: 'amber' as const, remaining: 3, next }
      : { ...current, next }
    set({
      junctions: updateJunction(state.junctions, junction.id, (local) => applySignal(local, signal)),
      toast: `${dir} ${phase} requested after signal clearance`,
    })
    state.pushLog(`${junction.name}: requested ${dir} ${phase} phase`)
  },

  setApproachGreen: (dir, seconds) => {
    const state = get()
    const junction = selectActiveJunction(state)
    if (!Number.isFinite(seconds)) return
    if (isInFallback(junction.id, state.devices)) {
      set({ toast: 'Timing changes are unavailable during local fallback' })
      return
    }
    const clamped = Math.max(junction.normalGreenSec, Math.min(junction.heavyGreenSec, seconds))
    set({
      junctions: updateJunction(state.junctions, junction.id, (local) => ({
        ...local,
        approaches: withAxisTiming(local, dir, clamped),
      })),
      toast: `${dir} next green set to ${clamped}s (demo)`,
    })
    state.pushLog(`${junction.name}: set ${dir} next green to ${clamped}s`)
  },

  cycleGreen: (dir) => {
    const junction = selectActiveJunction(get())
    const approach = junction.approaches.find((item) => item.direction === dir)
    if (!approach) return
    get().setApproachGreen(dir, approach.greenSeconds >= junction.heavyGreenSec
      ? junction.normalGreenSec : junction.heavyGreenSec)
  },

  reviewRecommendation: (id, status, note) => {
    const state = get()
    const target = state.recommendations.find((item) => item.id === id)
    if (!target || target.status !== 'pending') return
    const junction = state.junctions.find((item) => item.id === target.junctionId)!
    if (status === 'approved' && isInFallback(junction.id, state.devices)) {
      set({ toast: 'Restore local equipment before approving this suggestion' })
      return
    }
    const timestamp = new Date().toISOString()
    set({
      recommendations: state.recommendations.map((item) => item.id === id
        ? { ...item, status, operatorNote: note, reviewedAt: timestamp } : item),
      junctions: status === 'approved' ? updateJunction(state.junctions, junction.id, (local) => ({
        ...local,
        adaptive: true,
        approaches: withAxisTiming(local, target.approach, target.toSec),
      })) : state.junctions,
      toast: status === 'approved' ? 'Recommendation approved for the next green phase' : 'Recommendation rejected',
      incidents: [{
        id: `inc-review-${id}`,
        junctionId: junction.id,
        severity: status === 'approved' ? 'high' as const : 'info' as const,
        category: 'Control',
        title: status === 'approved' ? 'Adaptive green approved (demo)' : 'Timing suggestion rejected',
        message: status === 'approved' ? `${target.approach} next green set to ${target.toSec}s.` : note,
        timestamp,
        acknowledged: false,
        approach: target.approach,
      }, ...state.incidents].slice(0, 24),
    })
    state.pushLog(`${junction.name}: ${status} ${target.approach} timing suggestion`)
  },

  requestAiSuggestion: (dir = 'North') => {
    const state = get()
    const junction = selectActiveJunction(state)
    const approach = junction.approaches.find((item) => item.direction === dir)
    if (!approach) return
    if (isInFallback(junction.id, state.devices)) {
      set({ toast: 'Suggestions are unavailable during local fallback' })
      return
    }
    if (state.recommendations.some((item) => item.junctionId === junction.id && item.status === 'pending')) {
      set({ toast: 'This junction already has a pending suggestion' })
      return
    }
    if (approach.greenSeconds >= junction.heavyGreenSec) {
      set({ toast: 'This approach already has the extended green timing' })
      return
    }
    const rec = buildRecommendation(junction.id, approach, junction.heavyGreenSec, true)
    set({ recommendations: [rec, ...state.recommendations].slice(0, 36), toast: `Suggestion created for ${dir}` })
    state.pushLog(`${junction.name}: requested ${dir} timing suggestion`)
  },

  toggleDeviceFault: (id) => {
    const device = get().devices.find((d) => d.id === id)
    if (!device) return
    const nextStatus: DeviceStatus =
      device.status === 'online'
        ? 'offline'
        : device.status === 'offline'
          ? 'degraded'
          : 'online'
    get().setDeviceStatus(id, nextStatus)
  },

  setDeviceStatus: (id, status) => {
    const state = get()
    const device = state.devices.find((item) => item.id === id)
    if (!device || device.status === status) return
    const devices = state.devices.map((item) => item.id === id ? {
      ...item,
      status,
      lastHeartbeat: status === 'offline' ? item.lastHeartbeat : new Date().toISOString(),
      detail: status === 'online' ? 'Restored in demo'
        : status === 'degraded' ? 'Degraded — reduced confidence' : 'Simulated fault',
    } : item)
    const site = junctionSites.find((item) => item.id === device.junctionId)
    const fallback = site && isInFallback(site.id, devices)
    const newFallback = fallback && !isInFallback(site.id, state.devices)
    const fault: Incident[] = newFallback ? [{
      id: `fallback-${id}-${Date.now()}`, junctionId: site.id, severity: 'critical',
      category: 'Equipment', title: 'Fixed fallback plan active',
      message: `${site.name} reverted to fixed timing after an equipment fault.`,
      timestamp: new Date().toISOString(), acknowledged: false,
    }] : []
    set({
      devices,
      junctions: fallback ? updateJunction(state.junctions, site.id, fixedPlan) : state.junctions,
      incidents: [...fault, ...state.incidents].slice(0, 24),
      toast: fallback ? `${site.name} is on fixed fallback timing` : `${device.name}: ${status}`,
    })
    state.pushLog(`Set ${device.name} status to ${status}`)
  },

  restoreAllDevices: () => {
    set((s) => ({
      devices: s.devices.map((d) => ({
        ...d,
        status: 'online' as const,
        lastHeartbeat: new Date().toISOString(),
        detail: 'Restored in demo',
        uptimePct: Math.min(99.9, d.uptimePct + 1),
      })),
      toast: 'All devices restored',
    }))
    get().pushLog('Restored all roadside devices')
  },

  acknowledgeIncident: (id) => {
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, acknowledged: true } : i,
      ),
      toast: 'Incident acknowledged',
    }))
    get().pushLog(`Acknowledged incident ${id}`)
  },

  dismissIncident: (id) => {
    set((s) => ({
      incidents: s.incidents.filter((i) => i.id !== id),
      toast: 'Incident dismissed',
    }))
    get().pushLog(`Dismissed incident ${id}`)
  },

  injectIncident: (partial) => {
    const incident: Incident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      junctionId: partial?.junctionId ?? get().activeJunctionId,
      severity: partial?.severity ?? 'high',
      category: partial?.category ?? 'Traffic',
      title: partial?.title ?? 'Manual incident logged',
      message:
        partial?.message ??
        'Operator injected a sample incident for training / demo.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      approach: partial?.approach,
    }
    set((s) => ({
      incidents: [incident, ...s.incidents].slice(0, 24),
      notifOpen: true,
      toast: 'Incident injected',
    }))
    get().pushLog(`Injected incident: ${incident.title}`)
  },

  startSimulator: () => {
    if (simTimer) return () => undefined
    set({ simRunning: true })
    simTimer = setInterval(() => {
      const state = get()
      if (state.simPaused) return

      const tick = state.tick + 1
      const restriction = state.incidents.find((item) => item.id.startsWith('scenario-incident-'))
      const ambulance = state.vehicles.find((vehicle) => vehicle.kind === 'ambulance')
      const prioritySite = ambulance ? emergencyJunction(ambulance) : undefined
      const signals = state.junctions.map((junction) => {
        const fallback = isInFallback(junction.id, state.devices)
        const priority = !fallback && junction.id === prioritySite
        return advanceSignal(junction, fallback, priority)
      })
      const vehicles = advanceVehicles(state.vehicles, signals,
        restriction?.approach ? { junctionId: restriction.junctionId, direction: restriction.approach } : undefined)
      const junctions = measureJunctions(signals, vehicles)
      const newRecommendations = tick % 12 === 0 ? junctions.flatMap((junction) => {
        if (isInFallback(junction.id, state.devices) || state.recommendations.some((item) =>
          item.junctionId === junction.id && item.status === 'pending')) return []
        const busiest = junction.approaches.filter((approach) =>
          shouldSuggestHeavyGreen(approach, junction.heavyGreenSec) &&
          !state.recommendations.some((item) => item.junctionId === junction.id &&
            item.approach === approach.direction && item.status === 'rejected' &&
            item.reviewedAt && Date.now() - Date.parse(item.reviewedAt) < 30_000))
          .sort((a, b) => b.queueLength - a.queueLength)[0]
        return busiest ? [buildRecommendation(junction.id, busiest, junction.heavyGreenSec)] : []
      }) : []

      set({
        junctions,
        vehicles,
        buses: updateBuses(vehicles),
        ...(tick % 4 === 0 ? { routes: updateRoutes(junctions) } : {}),
        ...(tick % 20 === 0 ? {
          devices: state.devices.map((device) => device.status === 'offline' ? device
            : { ...device, lastHeartbeat: new Date().toISOString() }),
        } : {}),
        ...(newRecommendations.length ? {
          recommendations: [...newRecommendations, ...state.recommendations].slice(0, 36),
        } : {}),
        tick,
      })
    }, SIM_INTERVAL_MS)

    return () => {
      if (simTimer) clearInterval(simTimer)
      simTimer = null
      set({ simRunning: false })
    }
  },
}))
