import { lanes, networkJunctions } from '../data/network'
import type { Approach, Device, Direction, Junction, ScenarioId, SignalPhase } from '../types'
import { estimateWait } from './rules'

export const SIM_INTERVAL_MS = 250
const AMBER_SECONDS = 3
const VEHICLE_GAP = 13
export const signalAxes: Direction[][] = [['North', 'South'], ['East', 'West']]

export interface SignalCycle {
  axis: number
  phase: SignalPhase
  remaining: number
  direction?: Direction
  next?: { direction: Direction; phase: SignalPhase }
}

export interface Vehicle {
  id: string
  laneId: string
  kind: 'car' | 'bus' | 'truck' | 'ambulance'
  progress: number
  speed: number
  cruise: number
  color: string
}

export interface LiveJunction extends Junction {
  signal: SignalCycle
  adaptive: boolean
}

export function initialJunctions(): LiveJunction[] {
  return networkJunctions.map((junction, index) => ({
    ...junction,
    signal: { axis: index % 2, phase: 'green', remaining: 12 + index * 3 },
    adaptive: false,
  }))
}

export function isInFallback(junctionId: string, devices: Device[]) {
  const local = devices.filter((device) => device.junctionId === junctionId)
  return local.some((device) => device.type === 'controller' && device.status !== 'online') ||
    local.filter((device) => device.status === 'offline').length >= 2
}

export function applySignal(junction: LiveJunction, signal: SignalCycle): LiveJunction {
  const activeDirections = signal.direction ? [signal.direction] : signalAxes[signal.axis]
  return {
    ...junction,
    signal,
    approaches: junction.approaches.map((approach) => ({
      ...approach,
      phase: activeDirections.includes(approach.direction) ? signal.phase : 'red',
    })),
  }
}

export function advanceSignal(junction: LiveJunction, fallback: boolean, priority: boolean): LiveJunction {
  const signal = junction.signal
  if (signal.remaining > 1 && !(priority && signal.axis === 1 && signal.phase === 'green' && !signal.next)) return { ...junction, signal: { ...signal, remaining: signal.remaining - 1 } }

  if (signal.phase === 'green') {
    return applySignal(junction, { ...signal, phase: 'amber', remaining: AMBER_SECONDS })
  }
  if (signal.phase === 'amber') {
    return applySignal(junction, { ...signal, phase: 'red', remaining: junction.pedestrianProtectSec })
  }
  if (signal.next && !fallback && signal.next.phase !== 'red') {
    const { direction, phase } = signal.next
    const axis = signalAxes[0].includes(direction) ? 0 : 1
    const approach = junction.approaches.find((item) => item.direction === direction)!
    return applySignal(junction, { axis, phase, direction, remaining: phase === 'green' ? approach.greenSeconds : AMBER_SECONDS })
  }
  const axis = priority ? 0 : 1 - signal.axis
  const timings = junction.approaches.filter((approach) => signalAxes[axis].includes(approach.direction))
  const remaining = fallback ? junction.normalGreenSec : Math.max(...timings.map((approach) => approach.greenSeconds))
  return applySignal(junction, { axis, phase: 'green', remaining })
}

export function withGreen(approach: Approach, seconds: number): Approach {
  return {
    ...approach,
    greenSeconds: seconds,
    avgWaitSec: estimateWait(approach.queueLength, seconds),
  }
}

export function withAxisTiming(junction: LiveJunction, direction: Direction, seconds: number) {
  const axis = signalAxes.find((directions) => directions.includes(direction))!
  return junction.approaches.map((approach) =>
    axis.includes(approach.direction) ? withGreen(approach, seconds) : approach)
}

export function createVehicles(scenario: ScenarioId): Vehicle[] {
  return lanes.flatMap((lane, laneIndex) => {
    const boundaries = [0, ...lane.stops.map((stop) => stop.at), lane.length]
    return boundaries.slice(1).flatMap((end, segment) => {
      const start = boundaries[segment]
      const base = scenario === 'morning-peak' ? 9 : scenario === 'off-peak' ? 2 : 5
      const count = Math.min(Math.floor((end - start - 23) / VEHICLE_GAP), base + (laneIndex + segment) % 3)
      return Array.from({ length: Math.max(0, count) }, (_, index): Vehicle => {
        const bus = segment === 1 && index === 0
          ? ({ 0: 'bus-138', 1: 'bus-100', 4: 'bus-177' } as Record<number, string>)[laneIndex]
          : undefined
        const ambulance = scenario === 'emergency' && laneIndex === 1 && segment === 1 && index === 1
        const truck = (laneIndex + segment * 3 + index) % 11 === 0
        return {
          id: ambulance ? 'ambulance' : bus ?? `vehicle-${laneIndex}-${segment}-${index}`,
          laneId: lane.id,
          kind: ambulance ? 'ambulance' : bus ? 'bus' : truck ? 'truck' : 'car',
          progress: end - 1 - index * (scenario === 'morning-peak' ? VEHICLE_GAP : VEHICLE_GAP + 3),
          speed: 0,
          cruise: ambulance ? 8 : bus || truck ? 4.8 : 5.2 + (laneIndex + index) % 4 * 0.55,
          color: ['#b8c7d3', '#7fa5bb', '#e7c189', '#8297ad', '#a7bbb0'][(index + laneIndex) % 5],
        }
      }).filter((vehicle) => vehicle.progress > start + (segment === 0 ? 0 : 20))
    })
  })
}

export function vehiclePosition(vehicle: Pick<Vehicle, 'laneId' | 'progress'>) {
  const lane = lanes.find((entry) => entry.id === vehicle.laneId)!
  const along = lane.heading === 1 ? lane.road.start + vehicle.progress : lane.road.end - vehicle.progress
  const across = lane.road.fixed + (lane.road.axis === 'vertical' ? 1 : -1) * lane.heading * 7
  return lane.road.axis === 'vertical'
    ? { x: across, y: along, rotation: 90 * lane.heading }
    : { x: along, y: across, rotation: lane.heading === 1 ? 0 : 180 }
}

export function emergencyJunction(vehicle: Vehicle) {
  const lane = lanes.find((entry) => entry.id === vehicle.laneId)
  return lane?.stops.find((stop) => stop.at >= vehicle.progress && stop.at - vehicle.progress <= 80)?.junctionId
}

export function advanceVehicles(
  vehicles: Vehicle[],
  junctions: LiveJunction[],
  restriction?: { junctionId: string; direction: Direction },
): Vehicle[] {
  const byJunction = new Map(junctions.map((junction) => [junction.id, junction]))
  return lanes.flatMap((lane) => {
    const traffic = vehicles.filter((vehicle) => vehicle.laneId === lane.id)
      .sort((a, b) => b.progress - a.progress)
    return traffic.map((vehicle, index) => {
      const leader = traffic[index - 1] ?? traffic.at(-1)!
      const nextStop = lane.stops.find((stop) => stop.at >= vehicle.progress)
      const gap = leader === vehicle ? Infinity
        : leader.progress - vehicle.progress + (index === 0 ? lane.length : 0)
      let allowed = Math.max(0, gap - VEHICLE_GAP)
      if (nextStop) {
        const approach = byJunction.get(nextStop.junctionId)?.approaches.find((a) => a.direction === lane.direction)
        const restricted = restriction?.junctionId === nextStop.junctionId &&
          restriction.direction === lane.direction
        const distance = nextStop.at - vehicle.progress
        if (approach?.phase !== 'green') allowed = Math.min(allowed, distance)
        else if (restricted && distance < 70) allowed = Math.min(allowed, 1.45)
      }
      const speed = Math.min(vehicle.cruise, vehicle.speed + 1.5, allowed)
      return { ...vehicle, speed, progress: (vehicle.progress + speed) % lane.length }
    })
  })
}

export function measureJunctions(junctions: LiveJunction[], vehicles: Vehicle[]): LiveJunction[] {
  return junctions.map((junction) => ({
    ...junction,
    approaches: junction.approaches.map((approach) => {
      const lane = lanes.find((entry) => entry.direction === approach.direction &&
        entry.stops.some((stop) => stop.junctionId === junction.id))!
      const stopIndex = lane.stops.findIndex((stop) => stop.junctionId === junction.id)
      const stop = lane.stops[stopIndex].at
      const start = stopIndex === 0 ? 0 : lane.stops[stopIndex - 1].at + 34
      const approaching = vehicles.filter((vehicle) => vehicle.laneId === lane.id &&
        vehicle.progress >= start && vehicle.progress <= stop)
      const queueLength = approaching.filter((vehicle) => vehicle.speed < 0.75).length
      const speedKmh = approaching.length
        ? Math.round(approaching.reduce((sum, vehicle) => sum + vehicle.speed, 0) * 6 / approaching.length)
        : 0
      return {
        ...approach,
        queueLength,
        vehicleCount: approaching.length,
        avgWaitSec: queueLength ? estimateWait(queueLength, approach.greenSeconds) : 0,
        speedKmh,
        pedestrianWaiting: junction.signal.phase === 'red' ? 0 : Math.ceil(queueLength / 3),
      }
    }),
  }))
}
