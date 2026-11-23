import type { HourlyStat } from '../types'

export const hourlyStats: HourlyStat[] = [
  { hour: '05:00', volume: 120, avgWaitSec: 22, adaptiveWaitSec: 20, incidents: 0 },
  { hour: '06:00', volume: 280, avgWaitSec: 31, adaptiveWaitSec: 27, incidents: 1 },
  { hour: '07:00', volume: 620, avgWaitSec: 54, adaptiveWaitSec: 41, incidents: 2 },
  { hour: '08:00', volume: 890, avgWaitSec: 68, adaptiveWaitSec: 49, incidents: 3 },
  { hour: '09:00', volume: 710, avgWaitSec: 52, adaptiveWaitSec: 40, incidents: 1 },
  { hour: '10:00', volume: 480, avgWaitSec: 38, adaptiveWaitSec: 32, incidents: 0 },
  { hour: '11:00', volume: 410, avgWaitSec: 34, adaptiveWaitSec: 29, incidents: 1 },
  { hour: '12:00', volume: 530, avgWaitSec: 42, adaptiveWaitSec: 35, incidents: 1 },
  { hour: '13:00', volume: 460, avgWaitSec: 37, adaptiveWaitSec: 31, incidents: 0 },
  { hour: '14:00', volume: 390, avgWaitSec: 33, adaptiveWaitSec: 28, incidents: 0 },
  { hour: '15:00', volume: 450, avgWaitSec: 36, adaptiveWaitSec: 30, incidents: 1 },
  { hour: '16:00', volume: 670, avgWaitSec: 55, adaptiveWaitSec: 42, incidents: 2 },
  { hour: '17:00', volume: 920, avgWaitSec: 72, adaptiveWaitSec: 51, incidents: 4 },
  { hour: '18:00', volume: 840, avgWaitSec: 64, adaptiveWaitSec: 47, incidents: 2 },
  { hour: '19:00', volume: 510, avgWaitSec: 40, adaptiveWaitSec: 34, incidents: 1 },
  { hour: '20:00', volume: 300, avgWaitSec: 28, adaptiveWaitSec: 24, incidents: 0 },
]

export const equipmentStatsSeed = [
  { label: 'Controllers online', value: '1 / 1', tone: 'ok' as const },
  { label: 'Cameras healthy', value: '3 / 4', tone: 'warn' as const },
  { label: 'Sensors healthy', value: '3 / 4', tone: 'warn' as const },
  { label: 'GPS tracks live', value: '3 / 3', tone: 'ok' as const },
  { label: 'Pending AI actions', value: '1', tone: 'bad' as const },
  { label: 'Fallback plan', value: 'Armed', tone: 'neutral' as const },
]
