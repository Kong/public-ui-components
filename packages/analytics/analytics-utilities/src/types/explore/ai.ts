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

export const fetchableAiExploreDimensions = [
  'control_plane',
  'control_plane_group',
  'consumer',
  'application',
  'route',
] as const satisfies QueryableAiExploreDimensions[]

export const searchableLocalRequestDimensions = [
  'ai_provider',
  'ai_response_model',
  'ai_request_model',
  'llm_cache_status',
  'llm_embeddings_provider',
  'llm_embeddings_model',
] as const satisfies QueryableAiExploreDimensions[]

export type FetchableAiExploreDimensions = typeof fetchableAiExploreDimensions[number]

export const filterableFetchableAiExploreDimensions = makeFilterable(fetchableAiExploreDimensions)

export type FilterableFetchableAiExploreDimensions = typeof filterableFetchableAiExploreDimensions[number]

export const filterableSearchableLocalRequestDimensions = makeFilterable(searchableLocalRequestDimensions)

export type FilterableSearchableLocalRequestDimensions = typeof filterableSearchableLocalRequestDimensions[number]

export type QueryableAiExploreDimensions = typeof queryableAiExploreDimensions[number]

export interface AiExploreFilter extends Omit<BasicExploreFilter, 'dimension'> {
  dimension: FilterableFetchableAiExploreDimensions | FilterableSearchableLocalRequestDimensions
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

