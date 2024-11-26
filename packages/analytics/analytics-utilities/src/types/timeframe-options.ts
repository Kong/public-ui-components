import type { GranularityValues, RelativeTimeRangeValuesV4 } from './explore'

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
  allowedGranularitiesOverride?: GranularityValues[]
}
