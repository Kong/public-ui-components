import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'
import { exploreAggregations, queryableExploreDimensions } from './advanced'

export const queryableAgenticExploreDimensions = [
  ...queryableExploreDimensions,
  'a2a_context_id',
  'a2a_error',
  'a2a_method',
  'a2a_task_id',
  'mcp_error',
  'mcp_method',
  'mcp_session_id',
  'mcp_tool_name',
] as const

export type QueryableAgenticExploreDimensions = typeof queryableAgenticExploreDimensions[number]

export const filterableAgenticExploreDimensions = makeFilterable(queryableAgenticExploreDimensions)

export type FilterableAgenticExploreDimensions = typeof queryableAgenticExploreDimensions[number]

export interface AgenticExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
  field: FilterableAgenticExploreDimensions
}

export interface AgenticExploreEmptyFilterV2 extends Omit<BasicExploreEmptyFilterV2, 'field'> {
  field: FilterableAgenticExploreDimensions
}

export const agenticExploreAggregations = [
  ...exploreAggregations,
  'a2a_latency_average',
  'a2a_latency_p50',
  'a2a_latency_p95',
  'a2a_latency_p99',
  'a2a_response_body_size_sum',
  'mcp_response_body_size_sum',
] as const

export type AgenticExploreAggregations = typeof agenticExploreAggregations[number]

export type AgenticExploreFilterAll = AgenticExploreInFilterV2 | AgenticExploreEmptyFilterV2

export interface AgenticExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: AgenticExploreAggregations[]
  dimensions?: QueryableAgenticExploreDimensions[]
  filters?: AgenticExploreFilterAll[]
}

