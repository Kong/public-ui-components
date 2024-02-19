import type { GranularityKeys } from './granularity-keys'
import type { RelativeTimeRangeValuesV4 } from './explore-v4'

export interface TimeframeOptions {
  key: RelativeTimeRangeValuesV4 | 'custom'
  timeframeText: string
  display: string
  defaultResponseGranularity: GranularityKeys
  dataGranularity: GranularityKeys
  isRelative: boolean
  timeframeLength: () => number
  allowedTiers: Array<string>
  startCustom?: Date
  endCustom?: Date
}
