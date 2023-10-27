import type { GranularityKeys } from './granularity-keys'

export interface TimeframeOptions {
  key: string
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
