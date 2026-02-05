import { makeFilterable } from './util'
import type { ExploreFilterTypesV2, GranularityValues, RequestFilterTypeEmptyV2, TimeRangeV4 } from './common'

export const queryableBasicExploreDimensions = [
  'api',
  'api_package',
  'api_product',
  'api_product_version',
  'control_plane',
  'control_plane_group',
  'data_plane_node',
  'gateway_service',
  'portal',
  'route',
  'status_code',
  'status_code_grouped',
  'time',
] as const

export type QueryableBasicExploreDimensions = typeof queryableBasicExploreDimensions[number]

export const filterableBasicExploreDimensions = makeFilterable(queryableBasicExploreDimensions)

export type FilterableBasicExploreDimensions = typeof filterableBasicExploreDimensions[number]

export interface BasicExploreInFilterV2 {
  operator: ExploreFilterTypesV2
  field: FilterableBasicExploreDimensions
  value: Array<string | number | null>
}

export interface BasicExploreEmptyFilterV2 {
  operator: RequestFilterTypeEmptyV2
  field: FilterableBasicExploreDimensions
}
export const basicExploreAggregations = [
  'active_services',
  'error_rate',
  'request_count',
  'request_per_minute',
  'response_latency_average',
] as const

export type BasicExploreAggregations = typeof basicExploreAggregations[number]

export type BasicExploreFilterAll = BasicExploreInFilterV2 | BasicExploreEmptyFilterV2

export interface BasicExploreQuery {
  metrics?: BasicExploreAggregations[]
  dimensions?: QueryableBasicExploreDimensions[]
  filters?: BasicExploreFilterAll[]
  granularity?: GranularityValues
  time_range?: TimeRangeV4
  limit?: number
  descending?: boolean
  short_name?: boolean
  meta?: {
    query_id: string
  }
}
