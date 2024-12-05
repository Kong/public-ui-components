import type { DruidGranularity } from '.'

export interface QueryTime {
  granularitySeconds(): number
  granularityDruid(): DruidGranularity
  startSeconds(): number
  endSeconds(): number
  startMs(): number
  endMs(): number
  startDate(): Date
  endDate(): Date
  granularityMs(): number
}
