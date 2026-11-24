import type { Direction, Junction } from '../types'
import { pilotJunction } from './junction'
import { seedDevices } from './devices'

export const junctionSites = [
  { id: 'kollupitiya', name: 'Kollupitiya', road: 'Galle Road', x: 335, y: 146, lat: 6.9117, lng: 79.8519 },
  { id: 'town-hall', name: 'Town Hall', road: 'Dharmapala Mawatha', x: 750, y: 146, lat: 6.9155, lng: 79.8631 },
  { id: pilotJunction.id, name: 'Bambalapitiya', road: 'Galle Road', x: 335, y: 336, lat: pilotJunction.lat, lng: pilotJunction.lng },
  { id: 'thummulla', name: 'Thummulla', road: 'Reid Avenue', x: 750, y: 336, lat: 6.9016, lng: 79.8612 },
  { id: 'wellawatte', name: 'Wellawatte', road: 'Galle Road', x: 335, y: 526, lat: 6.8778, lng: 79.8610 },
  { id: 'havelock', name: 'Havelock Town', road: 'Havelock Road', x: 750, y: 526, lat: 6.8863, lng: 79.8725 },
]

export const pilotId = pilotJunction.id
export const networkJunctions: Junction[] = junctionSites.map((site, index) => ({
  ...pilotJunction,
  id: site.id,
  name: `${site.name} / ${site.road}`,
  lat: site.lat,
  lng: site.lng,
  approaches: pilotJunction.approaches.map((approach) => ({
    ...approach,
    id: `${site.id}-${approach.direction}`,
    phase: index % 2 === 0
      ? (approach.direction === 'North' || approach.direction === 'South' ? 'green' : 'red')
      : (approach.direction === 'East' || approach.direction === 'West' ? 'green' : 'red'),
  })),
}))

export const networkDevices = [
  ...seedDevices.map((device) => ({
    ...device,
    junctionId: device.type === 'gps' ? undefined : pilotId,
  })),
  ...junctionSites.filter((site) => site.id !== pilotId).flatMap((site) =>
    seedDevices.filter((device) => device.type !== 'gps').map((device) => ({
      ...device,
      id: `${site.id}-${device.id}`,
      junctionId: site.id,
      name: `${site.name} · ${device.name}`,
      status: 'online' as const,
      detail: 'Simulated telemetry active',
    })),
  ),
]

export const corridors = [
  { id: 'galle', name: 'Galle Road', axis: 'vertical', fixed: 335, start: 13, end: 642 },
  { id: 'havelock', name: 'Havelock Road', axis: 'vertical', fixed: 750, start: 13, end: 642 },
  { id: 'dharmapala', name: 'Dharmapala Mawatha', axis: 'horizontal', fixed: 146, start: 138, end: 1100 },
  { id: 'reid', name: 'Reid Avenue', axis: 'horizontal', fixed: 336, start: 138, end: 1100 },
  { id: 'galle-link', name: 'W. A. Silva Mawatha', axis: 'horizontal', fixed: 526, start: 138, end: 1100 },
] as const

export const lanes = corridors.flatMap((road) =>
  ([1, -1] as const).map((heading) => {
    const vertical = road.axis === 'vertical'
    const direction: Direction = vertical
      ? (heading === 1 ? 'North' : 'South')
      : (heading === 1 ? 'West' : 'East')
    return {
      id: `${road.id}:${heading}`,
      road,
      heading,
      direction,
      length: road.end - road.start,
      stops: junctionSites.filter((site) => (vertical ? site.x : site.y) === road.fixed)
        .map((site) => {
          const coordinate = vertical ? site.y : site.x
          return {
            junctionId: site.id,
            at: (heading === 1 ? coordinate - road.start : road.end - coordinate) - 21,
          }
        })
        .sort((a, b) => a.at - b.at),
    }
  }),
)
