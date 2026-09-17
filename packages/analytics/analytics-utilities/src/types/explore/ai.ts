import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'

export const queryableAiExploreDimensions = [
  'control_plane',
  'control_plane_group',
  'ai_gateway',
  'gateway_service',
  'consumer',
  'ai_gateway_consumer',
  'ai_gateway_consumer_group',
  'application',
  'oidc_credential',
  'route',
  'ai_provider',
  'ai_response_model',
  'ai_request_model',
  'llm_cache_status',
  'llm_embeddings_provider',
  'llm_embeddings_model',
  'time',
  'realm',
  'status_code',
  'status_code_grouped',
  'ai_plugin',
  'principal',
  'cache_status',
  'ai_gateway_mcp_server',
  'ai_gateway_model',
  'ai_gateway_agent',
  'ai_gateway_data_plane_node',
] as const

export type QueryableAiExploreDimensions = typeof queryableAiExploreDimensions[number]

export const filterableAiExploreDimensions = makeFilterable(queryableAiExploreDimensions)

export type FilterableAiExploreDimensions = typeof queryableAiExploreDimensions[number]

export interface AiExploreInFilterV2 extends Omit<BasicExploreInFilterV2, 'field'> {
  field: FilterableAiExploreDimensions
}

export interface AiExploreEmptyFilterV2 extends Omit<BasicExploreEmptyFilterV2, 'field'> {
  field: FilterableAiExploreDimensions
}

export const aiExploreAggregations = [
  'ai_request_count',
  'share_of_requests',
  'share_of_cost',
  'active_agents',
  'cached_tokens',
  'completion_tokens',
  'cost',
  'cost_per_request_average',
  'error_rate',
  'llm_cache_embeddings_latency_average',
  'llm_cache_fetch_latency_average',
  'llm_embeddings_cost',
  'llm_embeddings_tokens',
  'llm_latency_average',
  'prompt_tokens',
  'time_per_token_average',
  'time_per_token_p50',
  'time_per_token_p95',
  'time_per_token_p99',
  'time_to_first_token_average',
  'time_to_first_token_p50',
  'time_to_first_token_p95',
  'time_to_first_token_p99',
  'total_tokens',
  'total_tokens_per_minute',
] as const

export type AiExploreAggregations = typeof aiExploreAggregations[number]

export type AiExploreFilterAll = AiExploreInFilterV2 | AiExploreEmptyFilterV2

export interface AiExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: AiExploreAggregations[]
  dimensions?: QueryableAiExploreDimensions[]
  filters?: AiExploreFilterAll[]
}

