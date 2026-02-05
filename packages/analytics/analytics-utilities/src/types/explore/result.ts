import type { AllAggregations } from './all'

export interface Display {
  [id: string]: {
    name: string
    deleted?: boolean
    is_other_group?: boolean
  }
}

export interface DisplayBlob {
  [dimension: string]: Display
}

export interface QueryResponseMeta {
  start: string
  end: string
  start_ms?: number
  end_ms?: number
  display: DisplayBlob
  metric_names?: AllAggregations[]
  metric_units?: MetricUnit
  granularity_ms: number
  truncated?: boolean
  limit?: number
  query_id: string
}

export interface GroupByResult {
  version?: string
  timestamp: string
  event: RecordEvent
}

export interface ExploreResultV4 {
  data: GroupByResult[]
  meta: QueryResponseMeta
}

export interface RecordEvent {
  [field: string]: string | number | null
}

export interface AnalyticsExploreRecord {
  version?: string
  timestamp: string
  event: RecordEvent
}

export interface DimensionMap {
  [dimension: string]: string[]
}

export type MetricUnit = {
  [metricName in AllAggregations]?: string
}
