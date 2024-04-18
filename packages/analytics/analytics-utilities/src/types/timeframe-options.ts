import type { GranularityValues, RelativeTimeRangeValuesV4 } from './explore-v4'

export interface TimeframeOptions {
  key: RelativeTimeRangeValuesV4 | 'custom'
  timeframeText: string
  display: string
  defaultResponseGranularity: GranularityValues
  dataGranularity: GranularityValues
  isRelative: boolean
  timeframeLength: () => number
  allowedTiers: Array<string>
  startCustom?: Date
  endCustom?: Date
}
