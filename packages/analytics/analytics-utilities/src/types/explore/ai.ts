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
  'ape_decision',
  'ape_determining_policies',
  'application',
  'cache_status',
  'compression_compress_type',
  'compression_provider',
  'consumer',
  'control_plane',
  'control_plane_group',
  'gateway_service',
  'guardrail_block_direction',
  'guardrail_block_source',
  'llm_cache_status',
  'llm_embeddings_model',
  'llm_embeddings_provider',
  'oidc_credential',
  'principal',
  'principal_group',
  'realm',
  'response_source',
  'route',
  'status_code',
  'status_code_grouped',
  'time',
  'tool_name',
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
  'accepted_prediction_tokens',
  'active_agents',
  'ai_request_count',
  'audio_duration_seconds',
  'cache_write_tokens',
  'cached_audio_tokens',
  'cached_image_tokens',
  'cached_text_tokens',
  'cached_tokens',
  'cached_video_tokens',
  'completion_tokens',
  'compression_compress_token_count',
  'compression_compressed_message_count',
  'compression_duration',
  'compression_original_token_count',
  'compression_save_token_count',
  'cost',
  'cost_per_request_average',
  'error_rate',
  'image_count',
  'input_audio_tokens',
  'input_image_tokens',
  'input_text_tokens',
  'input_token_cost',
  'input_tokens',
  'input_video_tokens',
  'llm_cache_embeddings_latency_average',
  'llm_cache_fetch_latency_average',
  'llm_embeddings_cost',
  'llm_embeddings_tokens',
  'llm_latency_average',
  'llm_latency_p50',
  'llm_latency_p95',
  'llm_latency_p99',
  'output_audio_tokens',
  'output_image_tokens',
  'output_text_tokens',
  'output_token_cost',
  'output_tokens',
  'output_video_tokens',
  'prompt_tokens',
  'reasoning_tokens',
  'rejected_prediction_tokens',
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
  'tool_call_count',
  'tool_cost',
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

