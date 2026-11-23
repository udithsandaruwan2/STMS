import { create } from 'zustand'
import { seedBuses } from '../data/buses'
import { seedDevices } from '../data/devices'
import { equipmentStatsSeed, hourlyStats } from '../data/history'
import { seedIncidents } from '../data/incidents'
import { pilotJunction } from '../data/junction'
import { seedRoutes } from '../data/routes'
import {
  buildRecommendation,
  estimateWait,
  scenarioQueues,
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
  Junction,
  Recommendation,
  RecommendationStatus,
  ScenarioId,
  Severity,
  SignalPhase,
} from '../types'

interface TrafficState {
  junction: Junction
  devices: Device[]
  incidents: Incident[]
  recommendations: Recommendation[]
  hourlyStats: HourlyStat[]
  equipmentStats: typeof equipmentStatsSeed
  routes: AlternateRoute[]
  buses: BusTrack[]
  activityLog: ActivityLog[]
  adaptiveMode: boolean
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
  selectApproach: (dir: Direction | null) => void
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

function mutateApproaches(junction: Junction, adaptive: boolean): Junction {
  const phases: SignalPhase[] = ['green', 'amber', 'red']
  const approaches = junction.approaches.map((a, index) => {
    const drift = (Math.random() - 0.42) * (a.direction === 'North' ? 3.2 : 2.1)
    const queueLength = Math.max(2, Math.min(28, a.queueLength + drift))
    const vehicleCount = Math.max(4, Math.round(queueLength * 2.2 + Math.random() * 4))
    const targetGreen =
      adaptive && a.direction === 'North' && queueLength >= 16
        ? junction.heavyGreenSec
        : a.greenSeconds >= junction.heavyGreenSec && adaptive
          ? junction.heavyGreenSec
          : Math.max(junction.normalGreenSec, Math.min(a.greenSeconds, junction.heavyGreenSec))
    const phase = phases[(index + Math.floor(Date.now() / 8000)) % 3]
    const speedKmh = Math.max(6, Math.round(34 - queueLength * 1.1 + Math.random() * 3))
    const pedestrianWaiting = Math.max(
      0,
      Math.round(a.pedestrianWaiting + (Math.random() - 0.5) * 2),
    )
    return {
      ...a,
      queueLength,
      vehicleCount,
      greenSeconds: targetGreen,
      avgWaitSec: estimateWait(queueLength, targetGreen),
      phase,
      speedKmh,
      pedestrianWaiting,
    }
  })
  return { ...junction, approaches }
}

function mutateBuses(buses: BusTrack[]): BusTrack[] {
  return buses.map((b) => ({
    ...b,
    x: Math.max(80, Math.min(560, b.x + (Math.random() - 0.5) * 18)),
    y: Math.max(80, Math.min(440, b.y + (Math.random() - 0.5) * 14)),
    etaMin: Math.max(1, Math.round(b.etaMin + (Math.random() - 0.55) * 1.2)),
    passengers: Math.max(
      8,
      Math.min(65, Math.round(b.passengers + (Math.random() - 0.5) * 4)),
    ),
  }))
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
  junction: structuredClone(pilotJunction),
  devices: structuredClone(seedDevices),
  incidents: structuredClone(seedIncidents),
  recommendations: [
    {
      id: 'rec-seed-1',
      approach: 'North',
      fromSec: 30,
      toSec: 50,
      queueLength: 18,
      reason:
        'North queue length 18 vehicles exceeds threshold 16. Suggest extending green within approved safe plan. Pedestrian protect time unchanged.',
      status: 'pending',
      createdAt: new Date(Date.now() - 45000).toISOString(),
      confidence: 86,
    },
  ],
  hourlyStats,
  equipmentStats: equipmentStatsSeed,
  routes: structuredClone(seedRoutes),
  buses: structuredClone(seedBuses),
  activityLog: [
    nowLog('Pilot dashboard session started', 'System'),
    nowLog('Loaded Bambalapitiya sample junction', 'System'),
  ],
  adaptiveMode: false,
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
    set({
      adaptiveMode: value,
      toast: value ? 'Adaptive timing enabled' : 'Fixed timing restored',
    })
    get().pushLog(value ? 'Enabled adaptive timing' : 'Disabled adaptive timing')
  },

  setScenario: (scenario) => {
    const queues = scenarioQueues(scenario)
    const junction = get().junction
    const next = {
      ...junction,
      approaches: junction.approaches.map((a) => {
        const q = queues[a.direction]
        return {
          ...a,
          queueLength: q,
          vehicleCount: Math.round(q * 2.2),
          avgWaitSec: estimateWait(q, a.greenSeconds),
          speedKmh: Math.max(6, Math.round(34 - q * 1.1)),
        }
      }),
    }

    const extraIncidents: Incident[] = []
    if (scenario === 'emergency') {
      extraIncidents.push({
        id: `inc-emg-${Date.now()}`,
        severity: 'critical',
        category: 'Emergency',
        title: 'Emergency priority scenario active',
        message: 'Ambulance corridor sample — review South approach priority.',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        approach: 'South',
      })
    }
    if (scenario === 'incident') {
      extraIncidents.push({
        id: `inc-scn-${Date.now()}`,
        severity: 'high',
        category: 'Incident',
        title: 'Lane blockage scenario (sample)',
        message: 'South approach obstruction injected for demo training.',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        approach: 'South',
      })
    }

    set({
      scenario,
      junction: next,
      adaptiveMode: scenario === 'morning-peak',
      incidents: [...extraIncidents, ...get().incidents].slice(0, 16),
      toast: `Scenario loaded: ${scenario}`,
    })
    get().pushLog(`Applied scenario “${scenario}”`)
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  setNotifOpen: (open) => set({ notifOpen: open }),
  toggleNotifOpen: () => set((s) => ({ notifOpen: !s.notifOpen })),

  zoomIn: () => set((s) => ({ mapZoom: Math.min(1.8, +(s.mapZoom + 0.15).toFixed(2)) })),
  zoomOut: () => set((s) => ({ mapZoom: Math.max(0.7, +(s.mapZoom - 0.15).toFixed(2)) })),

  selectApproach: (dir) => set({ selectedApproach: dir, selectedBusId: null }),
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
    const cameras = get().devices.filter((d) => d.type === 'camera')
    const id = deviceId ?? cameras[0]?.id ?? null
    set({ cameraOpen: true, selectedDeviceId: id, toast: 'Camera viewer opened' })
    get().pushLog(`Opened camera feed ${id ?? ''}`)
  },
  closeCamera: () => set({ cameraOpen: false }),

  setApproachPhase: (dir, phase) => {
    set((s) => ({
      junction: {
        ...s.junction,
        approaches: s.junction.approaches.map((a) =>
          a.direction === dir ? { ...a, phase } : a,
        ),
      },
      toast: `${dir} phase set to ${phase}`,
    }))
    get().pushLog(`Set ${dir} signal phase → ${phase}`)
  },

  setApproachGreen: (dir, seconds) => {
    const junction = get().junction
    const clamped = Math.max(
      junction.normalGreenSec,
      Math.min(junction.heavyGreenSec, seconds),
    )
    set((s) => ({
      junction: {
        ...s.junction,
        approaches: s.junction.approaches.map((a) =>
          a.direction === dir
            ? {
                ...a,
                greenSeconds: clamped,
                avgWaitSec: estimateWait(a.queueLength, clamped),
              }
            : a,
        ),
      },
      toast: `${dir} green set to ${clamped}s (demo)`,
    }))
    get().pushLog(`Adjusted ${dir} green → ${clamped}s`)
  },

  cycleGreen: (dir) => {
    const a = get().junction.approaches.find((x) => x.direction === dir)
    if (!a) return
    const next =
      a.greenSeconds >= get().junction.heavyGreenSec
        ? get().junction.normalGreenSec
        : get().junction.heavyGreenSec
    get().setApproachGreen(dir, next)
  },

  reviewRecommendation: (id, status, note) => {
    const { recommendations, junction, adaptiveMode } = get()
    const target = recommendations.find((r) => r.id === id)
    const nextRecs = recommendations.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            operatorNote: note,
            reviewedAt: new Date().toISOString(),
          }
        : r,
    )

    let nextJunction = junction
    if (status === 'approved' && target) {
      nextJunction = {
        ...junction,
        approaches: junction.approaches.map((a) =>
          a.direction === target.approach
            ? { ...a, greenSeconds: target.toSec }
            : a,
        ),
      }
    }

    set({
      recommendations: nextRecs,
      junction: nextJunction,
      adaptiveMode: status === 'approved' ? true : adaptiveMode,
      toast:
        status === 'approved'
          ? 'Recommendation approved'
          : 'Recommendation rejected',
      incidents: [
        {
          id: `inc-review-${Date.now()}`,
          severity: (status === 'approved' ? 'high' : 'info') as Severity,
          category: 'Control',
          title:
            status === 'approved'
              ? 'Adaptive green approved (illustrative)'
              : 'AI suggestion rejected',
          message:
            status === 'approved'
              ? `${target?.approach ?? 'Approach'} green extended under operator supervision. Demo only — no real actuation.`
              : note || 'Operator retained fixed timing plan.',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          approach: target?.approach,
        },
        ...get().incidents,
      ].slice(0, 16),
    })
    get().pushLog(
      status === 'approved'
        ? `Approved AI suggestion ${id}`
        : `Rejected AI suggestion ${id}`,
    )
  },

  requestAiSuggestion: (dir = 'North') => {
    const junction = get().junction
    const approach = junction.approaches.find((a) => a.direction === dir)
    if (!approach) return
    if (get().recommendations.some((r) => r.status === 'pending')) {
      set({ toast: 'A pending suggestion already exists' })
      return
    }
    const rec = buildRecommendation(
      { ...approach, queueLength: Math.max(approach.queueLength, 17) },
      junction.normalGreenSec,
      junction.heavyGreenSec,
    )
    set((s) => ({
      recommendations: [rec, ...s.recommendations].slice(0, 10),
      toast: `AI suggestion created for ${dir}`,
    }))
    get().pushLog(`Requested AI suggestion for ${dir}`)
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
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              lastHeartbeat: new Date().toISOString(),
              detail:
                status === 'online'
                  ? 'Restored in demo'
                  : status === 'degraded'
                    ? 'Degraded — reduced confidence'
                    : 'Simulated fault injected for demo',
            }
          : d,
      ),
      toast: `Device ${id} → ${status}`,
    }))
    get().pushLog(`Set device ${id} status → ${status}`)
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
      id: `inc-${Date.now()}`,
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
      incidents: [incident, ...s.incidents].slice(0, 16),
      notifOpen: true,
      toast: 'Incident injected',
    }))
    get().pushLog(`Injected incident: ${incident.title}`)
  },

  startSimulator: () => {
    if (simTimer) return () => undefined
    set({ simRunning: true, simPaused: false })
    simTimer = setInterval(() => {
      const state = get()
      if (state.simPaused) return

      const junction = mutateApproaches(state.junction, state.adaptiveMode)
      const buses = mutateBuses(state.buses)
      const north = junction.approaches.find((a) => a.direction === 'North')
      let recommendations = state.recommendations
      const hasPending = recommendations.some((r) => r.status === 'pending')

      if (
        north &&
        !hasPending &&
        shouldSuggestHeavyGreen(
          north,
          junction.normalGreenSec,
          junction.heavyGreenSec,
        ) &&
        !state.adaptiveMode &&
        Math.random() > 0.65
      ) {
        recommendations = [
          buildRecommendation(
            north,
            junction.normalGreenSec,
            junction.heavyGreenSec,
          ),
          ...recommendations,
        ].slice(0, 10)
      }

      const devices = state.devices.map((d) =>
        Math.random() > 0.9
          ? { ...d, lastHeartbeat: new Date().toISOString() }
          : d,
      )

      const routes = state.routes.map((r) => {
        if (Math.random() > 0.7) return r
        const etaDelta = Math.round((Math.random() - 0.45) * 3)
        return {
          ...r,
          etaMin: Math.max(6, r.etaMin + etaDelta),
        }
      })

      set({
        junction,
        devices,
        buses,
        routes,
        recommendations,
        tick: state.tick + 1,
      })
    }, 2500)

    return () => {
      if (simTimer) clearInterval(simTimer)
      simTimer = null
      set({ simRunning: false })
    }
  },
}))
