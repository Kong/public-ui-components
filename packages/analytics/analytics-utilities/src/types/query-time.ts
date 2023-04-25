import { DruidGranularity } from '.'

export interface QueryTime {
  granularitySeconds(): number
  granularityDruid(): DruidGranularity | null
  startSeconds(): number
  endSeconds(): number
  startDate(): Date
  endDate(): Date
  granularityMs(): number
}
