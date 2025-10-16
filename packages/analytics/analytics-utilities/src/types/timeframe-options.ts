import type { GranularityValues, RelativeTimeRangeValuesV4 } from './explore'

export interface TimeframeOptions {
  key: RelativeTimeRangeValuesV4 | ExtendedRelativeTimeRangeValues | 'custom'
  timeframeText: string
  display: string
  defaultResponseGranularity: GranularityValues
  dataGranularity: GranularityValues
  isRelative: boolean
  timeframeLength: () => number
  allowedTiers: string[]
  startCustom?: Date
  endCustom?: Date
  allowedGranularitiesOverride?: GranularityValues[]
  fineGrainedDefaultGranularity?: GranularityValues
}

// Supported by time periods, but not supported in Explore APIs.
export const extendedRelativeTimeRangeValues = ['90d', '180d', '365d', 'current_year', 'previous_year'] as const
export type ExtendedRelativeTimeRangeValues = typeof extendedRelativeTimeRangeValues[number]
