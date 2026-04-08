// TODO: remove this file once the frontend has updated to use new agentic datasource
import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'
import { exploreAggregations, queryableExploreDimensions } from './advanced'

/** @deprecated Use queryableAgenticExploreDimensions instead */
export const queryableMcpExploreDimensions = [
  ...queryableExploreDimensions,
  'mcp_session_id',
  'mcp_method',
  'mcp_tool_name',
  'mcp_error',
] as const

/** @deprecated Use QueryableAgenticExploreDimensions instead */
export type QueryableMcpExploreDimensions = typeof queryableMcpExploreDimensions[number]

/** @deprecated Use filterableAgenticExploreDimensions instead */
export const filterableMcpExploreDimensions = makeFilterable(queryableMcpExploreDimensions)

/** @deprecated Use FilterableAgenticExploreDimensions instead */
export type FilterableMcpExploreDimensions = typeof queryableMcpExploreDimensions[number]

/** @deprecated Use AgenticExploreInFilterV2 instead */
export interface McpExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
  field: FilterableMcpExploreDimensions
}

/** @deprecated Use AgenticExploreEmptyFilterV2 instead */
export interface McpExploreEmptyFilterV2 extends Omit<BasicExploreEmptyFilterV2, 'field'> {
  field: FilterableMcpExploreDimensions
}

/** @deprecated Use agenticExploreAggregations instead */
export const mcpExploreAggregations = [
  ...exploreAggregations,
  'mcp_response_body_size_sum',
] as const

/** @deprecated Use AgenticExploreAggregations instead */
export type McpExploreAggregations = typeof mcpExploreAggregations[number]

/** @deprecated Use AgenticExploreFilterAll instead */
export type McpExploreFilterAll = McpExploreInFilterV2 | McpExploreEmptyFilterV2

/** @deprecated Use AgenticExploreQuery instead */
export interface McpExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: McpExploreAggregations[]
  dimensions?: QueryableMcpExploreDimensions[]
  filters?: McpExploreFilterAll[]
}

