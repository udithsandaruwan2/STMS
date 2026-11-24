export type Direction = 'North' | 'South' | 'East' | 'West'
export type DeviceType = 'camera' | 'sensor' | 'gps' | 'controller'
export type DeviceStatus = 'online' | 'degraded' | 'offline'
export type Severity = 'critical' | 'high' | 'minor' | 'info'
export type RecommendationStatus = 'pending' | 'approved' | 'rejected'
export type SignalPhase = 'green' | 'amber' | 'red'
export type ScenarioId = 'live' | 'morning-peak' | 'off-peak' | 'incident' | 'emergency'
export type RouteCrowd = 'Light' | 'Medium' | 'Heavy'

export interface Approach {
  id: string
  direction: Direction
  queueLength: number
  vehicleCount: number
  phase: SignalPhase
  greenSeconds: number
  avgWaitSec: number
  speedKmh: number
  pedestrianWaiting: number
}

export interface Junction {
  id: string
  name: string
  city: string
  lat: number
  lng: number
  normalGreenSec: number
  heavyGreenSec: number
  pedestrianProtectSec: number
  approaches: Approach[]
}

export interface Device {
  id: string
  name: string
  type: DeviceType
  junctionId?: string
  approach?: Direction
  status: DeviceStatus
  lastHeartbeat: string
  detail: string
  uptimePct: number
}

export interface Incident {
  id: string
  severity: Severity
  junctionId: string
  category: string
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  approach?: Direction
}

export interface Recommendation {
  id: string
  junctionId: string
  approach: Direction
  fromSec: number
  toSec: number
  queueLength: number
  reason: string
  status: RecommendationStatus
  createdAt: string
  reviewedAt?: string
  operatorNote?: string
  confidence: number
}

export interface HourlyStat {
  hour: string
  volume: number
  avgWaitSec: number
  adaptiveWaitSec: number
  incidents: number
}

export interface EquipmentStat {
  label: string
  value: string
  tone: 'ok' | 'warn' | 'bad' | 'neutral'
}

export interface AlternateRoute {
  id: string
  name: string
  via: string[]
  distanceKm: number
  etaMin: number
  crowd: RouteCrowd
  status: 'recommended' | 'open' | 'congested'
}

export interface BusTrack {
  id: string
  routeNo: string
  label: string
  x: number
  y: number
  etaMin: number
  passengers: number
  status: 'on-time' | 'delayed' | 'approaching'
}

export interface ActivityLog {
  id: string
  time: string
  actor: string
  action: string
}

export interface CameraFrame {
  id: string
  approach: Direction
  label: string
  density: number
  lastCapture: string
}
