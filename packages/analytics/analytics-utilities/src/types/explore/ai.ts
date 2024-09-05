import { makeFilterable } from './util'
import type { BasicExploreFilter, BasicExploreQuery } from './basic'

export const queryableAiExploreDimensions = [
  'control_plane',
  'control_plane_group',
  'gateway_service',
  'consumer',
  'application',
  'route',
  'ai_provider',
  'ai_response_model',
  'ai_request_model',
  'llm_cache_status',
  'llm_embeddings_provider',
  'llm_embeddings_model',
  'time',
] as const

export type QueryableAiExploreDimensions = typeof queryableAiExploreDimensions[number]

export const filterableAiExploreDimensions = makeFilterable(queryableAiExploreDimensions)

export type FilterableAiExploreDimensions = typeof queryableAiExploreDimensions[number]

export interface AiExploreFilter extends Omit<BasicExploreFilter, 'dimension'> {
  dimension: FilterableAiExploreDimensions
}

export const aiExploreAggregations = [
  'total_tokens',
  'prompt_tokens',
  'completion_tokens',
  'ai_request_count',
  'cost',
  'llm_cache_embeddings_latency_average',
  'llm_cache_fetch_latency_average',
  'llm_latency_average',
  'llm_embeddings_tokens',
  'llm_embeddings_cost',
] as const

export type AiExploreAggregations = typeof aiExploreAggregations[number]

export interface AiExploreQuery extends Omit<BasicExploreQuery, 'metrics' | 'dimensions' | 'filters'> {
  metrics?: AiExploreAggregations[]
  dimensions?: QueryableAiExploreDimensions[]
  filters?: AiExploreFilter[]
}

