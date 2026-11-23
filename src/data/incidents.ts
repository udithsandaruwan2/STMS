import type { Incident } from '../types'

export const seedIncidents: Incident[] = [
  {
    id: 'inc-1',
    severity: 'critical',
    category: 'Equipment',
    title: 'Loop Sensor East offline',
    message:
      'East approach sensor lost heartbeat. Camera estimate is being used until restored.',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    acknowledged: false,
    approach: 'East',
  },
  {
    id: 'inc-2',
    severity: 'high',
    category: 'Congestion',
    title: 'Heavy queue on North approach',
    message:
      'Morning peak build-up on Galle Road North. Adaptive green extension may be suggested.',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    acknowledged: false,
    approach: 'North',
  },
  {
    id: 'inc-3',
    severity: 'critical',
    category: 'Emergency',
    title: 'Ambulance V2X approach (sample)',
    message:
      'Equipped emergency vehicle reported near junction. Review safe priority procedure.',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    acknowledged: false,
    approach: 'South',
  },
  {
    id: 'inc-4',
    severity: 'minor',
    category: 'Traffic',
    title: 'West approach slowing',
    message: 'Moderate delay forming. Pedestrian phase remains protected.',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    acknowledged: false,
    approach: 'West',
  },
  {
    id: 'inc-5',
    severity: 'info',
    category: 'System',
    title: 'Pilot mode active',
    message:
      'Illustrative timings only (30s / 50s). No real signal actuation in this prototype.',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    acknowledged: true,
  },
  {
    id: 'inc-6',
    severity: 'high',
    category: 'Incident',
    title: 'Minor collision reported (sample)',
    message:
      'Two vehicles reported near South approach. Temporary lane obstruction possible.',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    acknowledged: false,
    approach: 'South',
  },
  {
    id: 'inc-7',
    severity: 'minor',
    category: 'Camera',
    title: 'East camera glare',
    message: 'Confidence reduced on East CCTV. Counts cross-checked with remaining sensors.',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    acknowledged: false,
    approach: 'East',
  },
]
