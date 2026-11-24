import type { Approach, Recommendation } from '../types'

export const HEAVY_QUEUE = 8

export function shouldSuggestHeavyGreen(approach: Approach, heavyGreen: number) {
  return approach.queueLength >= HEAVY_QUEUE && approach.greenSeconds < heavyGreen
}

export function buildRecommendation(
  junctionId: string,
  approach: Approach,
  heavyGreen: number,
  manual = false,
): Recommendation {
  const queue = Math.round(approach.queueLength)
  return {
    id: `rec-${junctionId}-${approach.direction}-${Date.now()}`,
    junctionId,
    approach: approach.direction,
    fromSec: approach.greenSeconds,
    toSec: heavyGreen,
    queueLength: queue,
    reason: manual
      ? `Operator requested a timing comparison for the ${approach.direction} approach. Current queue is ${queue} vehicles.`
      : `${queue} vehicles are queued on the ${approach.direction} approach. Consider extending green within the demo plan. Pedestrian protection stays in place.`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    confidence: Math.min(97, 60 + queue * 3),
  }
}

export function estimateWait(queue: number, greenSec: number) {
  if (queue === 0) return 0
  return Math.max(2, Math.round(queue * 3.7 - greenSec * 0.23))
}

export function driverMessage(maxQueue: number, pending: boolean, location: string): string {
  if (maxQueue >= HEAVY_QUEUE) {
    return pending
      ? `Heavy traffic near ${location}. Operators are reviewing signal timing. Check alternate routes before travelling.`
      : `Heavy traffic near ${location}. Consider an alternate route.`
  }
  if (maxQueue >= 4) return `Moderate delays near ${location}. Allow extra travel time.`
  return `Traffic near ${location} is currently light.`
}

export function phaseColor(phase: Approach['phase']) {
  if (phase === 'green') return '#39d99a'
  if (phase === 'amber') return '#ffc46b'
  return '#f77971'
}
