import type { Approach, Direction, Recommendation, ScenarioId } from '../types'

const QUEUE_THRESHOLD = 16

export function shouldSuggestHeavyGreen(
  approach: Approach,
  _normalGreen: number,
  heavyGreen: number,
) {
  return (
    approach.queueLength >= QUEUE_THRESHOLD &&
    approach.greenSeconds < heavyGreen &&
    approach.direction === 'North'
  )
}

export function buildRecommendation(
  approach: Approach,
  normalGreen: number,
  heavyGreen: number,
): Recommendation {
  const confidence = Math.min(
    97,
    Math.round(62 + (approach.queueLength - QUEUE_THRESHOLD) * 4 + Math.random() * 8),
  )
  return {
    id: `rec-${Date.now()}`,
    approach: approach.direction,
    fromSec: normalGreen,
    toSec: heavyGreen,
    queueLength: Math.round(approach.queueLength),
    reason: `${approach.direction} queue length ${Math.round(approach.queueLength)} vehicles exceeds threshold ${QUEUE_THRESHOLD}. Suggest extending green within approved safe plan. Pedestrian protect time unchanged.`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    confidence,
  }
}

export function estimateWait(queue: number, greenSec: number) {
  const clearance = Math.max(greenSec * 0.55, 8)
  return Math.max(12, Math.round(queue * 2.4 - clearance * 0.35))
}

export function driverMessage(maxQueue: number, pending: boolean): string {
  if (maxQueue >= 16) {
    return pending
      ? 'Heavy traffic ahead on Galle Road North; consider Marine Drive or another route while operators review signal timing.'
      : 'Heavy traffic ahead; consider another route.'
  }
  if (maxQueue >= 10) {
    return 'Moderate delays near Bambalapitiya junction. Allow extra travel time.'
  }
  return 'Traffic near Bambalapitiya junction is currently light.'
}

export function phaseColor(phase: Approach['phase']) {
  if (phase === 'green') return '#22c55e'
  if (phase === 'amber') return '#f59e0b'
  return '#ef4444'
}

export function scenarioQueues(scenario: ScenarioId): Record<Direction, number> {
  switch (scenario) {
    case 'morning-peak':
      return { North: 22, South: 14, East: 9, West: 16 }
    case 'off-peak':
      return { North: 5, South: 4, East: 3, West: 4 }
    case 'incident':
      return { North: 12, South: 24, East: 8, West: 10 }
    case 'emergency':
      return { North: 10, South: 18, East: 7, West: 9 }
    default:
      return { North: 18, South: 9, East: 6, West: 11 }
  }
}

export type { Direction }
