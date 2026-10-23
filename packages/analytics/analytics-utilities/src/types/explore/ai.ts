import { makeFilterable } from './util'
import type { BasicExploreEmptyFilterV2, BasicExploreInFilterV2, BasicExploreQuery } from './basic'

export const queryableAiExploreDimensions = [
  'ai_gateway',
  'ai_gateway_agent',
  'ai_gateway_consumer',
  'ai_gateway_consumer_group',
  'ai_gateway_data_plane_node',
  'ai_gateway_mcp_server',
  'ai_gateway_model',
  'ai_gateway_version',
  'ai_plugin',
  'ai_provider',
  'ai_request_model',
  'ai_response_model',
  'application',
  'cache_status',
  'consumer',
  'control_plane',
  'control_plane_group',
  'gateway_service',
  'llm_cache_status',
  'llm_embeddings_model',
  'llm_embeddings_provider',
  'oidc_credential',
  'principal',
  'realm',
  'response_source',
  'route',
  'status_code',
  'status_code_grouped',
  'time',
  'upstream_status_code',
  'upstream_status_code_grouped',
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
  'active_agents',
  'ai_request_count',
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
  'llm_latency_p50',
  'llm_latency_p95',
  'llm_latency_p99',
  'prompt_tokens',
  'share_of_cost',
  'share_of_requests',
  'time_per_token_average',
  'time_per_token_p50',
  'time_per_token_p95',
  'time_per_token_p99',
  'time_to_first_token_average',
  'time_to_first_token_p50',
  'time_to_first_token_p95',
  'time_to_first_token_p99',
  'token_cache_hit_rate',
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

