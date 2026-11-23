import type { BusTrack } from '../types'

export const seedBuses: BusTrack[] = [
  {
    id: 'bus-138',
    routeNo: '138',
    label: 'Pettah → Dehiwala',
    x: 420,
    y: 150,
    etaMin: 4,
    passengers: 38,
    status: 'approaching',
  },
  {
    id: 'bus-100',
    routeNo: '100',
    label: 'Fort → Moratuwa',
    x: 210,
    y: 360,
    etaMin: 7,
    passengers: 52,
    status: 'delayed',
  },
  {
    id: 'bus-177',
    routeNo: '177',
    label: 'Kottawa → Colombo',
    x: 480,
    y: 300,
    etaMin: 11,
    passengers: 29,
    status: 'on-time',
  },
]
