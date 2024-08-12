import { makeFilterable } from './util'
import type { ExploreFilterTypesV2, GranularityValues, TimeRangeV4 } from './common'

export const queryableBasicExploreDimensions = [
  'api_product',
  'api_product_version',
  'control_plane',
  'control_plane_group',
  'data_plane_node',
  'gateway_service',
  'route',
  'status_code',
  'status_code_grouped',
  'time',
] as const

export type QueryableBasicExploreDimensions = typeof queryableBasicExploreDimensions[number]

export const filterableBasicExploreDimensions = makeFilterable(queryableBasicExploreDimensions)

export type FilterableBasicExploreDimensions = typeof filterableBasicExploreDimensions[number]

export interface BasicExploreFilter {
  type: ExploreFilterTypesV2
  dimension?: FilterableBasicExploreDimensions
  field?: FilterableBasicExploreDimensions
  values?: (string | number | null)[]
}

export const basicExploreAggregations = [
  'active_services',
  'request_count',
  'request_per_minute',
  'response_latency_average',
] as const

export type BasicExploreAggregations = typeof basicExploreAggregations[number]

export interface BasicExploreQuery {
  metrics?: BasicExploreAggregations[]
  dimensions?: QueryableBasicExploreDimensions[]
  filters?: BasicExploreFilter[]
  granularity?: GranularityValues
  time_range?: TimeRangeV4
  limit?: number
  descending?: boolean
  short_name?: boolean
  meta?: {
    query_id: string
  }
}