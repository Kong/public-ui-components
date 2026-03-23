
export interface TimeframeOptions {
  key: string
  timeframeText: string
  display: string
  defaultResponseGranularity: string
  dataGranularity: string
  isRelative: boolean
  timeframeLength: () => number
  allowedTiers: string[]
  startCustom?: Date
  endCustom?: Date
  allowedGranularitiesOverride?: string[]
  fineGrainedDefaultGranularity?: string
}

// Supported by time periods, but not supported in Explore APIs.
export const extendedRelativeTimeRangeValues = [
  '90d',
  '180d',
  '365d',
  'current_quarter',
  'previous_quarter',
  'current_year',
  'previous_year',
] as const
export type ExtendedRelativeTimeRangeValues = typeof extendedRelativeTimeRangeValues[number]
