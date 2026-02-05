import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'
import { exploreAggregations, queryableExploreDimensions } from './advanced'

export const queryableMcpExploreDimensions = [
  ...queryableExploreDimensions,
  'mcp_session_id',
  'mcp_method',
  'mcp_tool_name',
  'mcp_error',
] as const

export type QueryableMcpExploreDimensions = typeof queryableMcpExploreDimensions[number]

export const filterableMcpExploreDimensions = makeFilterable(queryableMcpExploreDimensions)

export type FilterableMcpExploreDimensions = typeof queryableMcpExploreDimensions[number]

export interface McpExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
  field: FilterableMcpExploreDimensions
}

export interface McpExploreEmptyFilterV2 extends Omit<BasicExploreEmptyFilterV2, 'field'> {
  field: FilterableMcpExploreDimensions
}

export const mcpExploreAggregations = [
  ...exploreAggregations,
  'mcp_response_body_size_sum',
] as const

export type McpExploreAggregations = typeof mcpExploreAggregations[number]

export type McpExploreFilterAll = McpExploreInFilterV2 | McpExploreEmptyFilterV2

export interface McpExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: McpExploreAggregations[]
  dimensions?: QueryableMcpExploreDimensions[]
  filters?: McpExploreFilterAll[]
}

