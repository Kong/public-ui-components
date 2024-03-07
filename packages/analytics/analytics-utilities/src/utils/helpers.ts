import type { AnalyticsExploreV2Result } from '../types'

export function generateRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'

  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }

  return color
}

export function rand(min: number, max: number): number {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function isValidJson(str: string): boolean {
  if (!str) return true

  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }

  return true
}

export function parseJson(exploreResultText: AnalyticsExploreV2Result) {
  try {
    const result = JSON.parse(exploreResultText as any)

    return result as AnalyticsExploreV2Result
  } catch (e) {
    return null
  }
}
