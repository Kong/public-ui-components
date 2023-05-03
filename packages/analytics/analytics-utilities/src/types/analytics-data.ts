export interface RecordEvent {
  [field: string]: string | number
}

export interface AnalyticsExploreRecord {
  version: string
  timestamp: string
  event: RecordEvent
}

export interface DimensionMap {
  [dimension: string]: string[]
}

export interface MetricUnit {
  [metricName: string]: string
}

/**
 * Granularity object as accepted by Druid
 */
export interface GranularityFullObj {
  type: string
  duration?: number
  period?: string
  timeZone?: string
  origin?: string | number
}

export interface BaseExploreMeta {
  /**
   * Optional query id to be used to trace the original query from which this data resulted
   */
  queryId: string
  /**
   * Map of dimension names
   * Example - { Service: ['service1', 'service2', ... ] }
   */
  dimensions?: DimensionMap
  /**
   * List of metrics in this result
   */
  metricNames?: string[]
  /**
   * Mapping of metric names to metric units
   * Example - { TotalRequests: 'count', Latency: 'ms' }
   */
  metricUnits?: MetricUnit
  /**
   * Granularity of this dataset in milliseconds
   */
  granularity?: number | GranularityFullObj
  /**
   * True if results are truncated
   */
  truncated?: boolean
  /**
   * Limit applied to the original query
   */
  limit?: number
}

/**
 * Metadata about the explore result
 */
export interface AnalyticsExploreMeta extends BaseExploreMeta {
  /**
   * Second timestamp representing the start of this dataset
   */
  start: number
  /**
   * Second timestamp representing the end of this dataset
   */
  end: number
}

/**
 * Metadata about the exploreV2 result
 */
export interface AnalyticsExploreV2Meta extends BaseExploreMeta {
  /**
   * Millisecond timestamp representing the start of this dataset
   */
  startMs: number
  /**
   * Millisecond timestamp representing the end of this dataset
   */
  endMs: number
}

/**
 * Analytics query data object
 */
export interface AnalyticsExploreResult {
  /**
   * Array of records
   */
  records: AnalyticsExploreRecord[]
  /**
   * Additional metadata about the query
   */
  meta: AnalyticsExploreMeta
}
