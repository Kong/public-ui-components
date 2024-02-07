import type { ExploreAggregations, QueryableExploreDimensions } from './explore-v4'

export type RecordEvent = {
  [field in ExploreAggregations | QueryableExploreDimensions]?: string | number | null
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
  [metricName in ExploreAggregations]?: string
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
  metricNames?: ExploreAggregations[]
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
 * Display information for a given entity ID.
 */
export interface AnalyticsExploreV3Display {
  name: string;
  deleted: boolean;
  isOtherGroup?: boolean;
}

/**
 * Metadata about the exploreV3 result
 */
export interface AnalyticsExploreV3Meta extends Omit<AnalyticsExploreV2Meta, 'dimensions'> {
  /*
   * Structure containing mappings of IDs to display names
  */
  display: Record<string, Record<string, AnalyticsExploreV3Display>>
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

/**
 * Analytics exploreV2 query data object
 */
export interface AnalyticsExploreV2Result {
  /**
   * Array of records
   */
  records: AnalyticsExploreRecord[]
  /**
   * Additional exploreV2 metadata about the query
   */
  meta: AnalyticsExploreV2Meta
}

/**
 * Analytics exploreV3 query data object
 */
export interface AnalyticsExploreV3Result {
  /**
   * Array of records
   */
  records: AnalyticsExploreRecord[]
  /**
   * Additional exploreV3 metadata about the query
   */
  meta: AnalyticsExploreV3Meta
}
