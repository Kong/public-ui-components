import { describe, expect, it } from 'vitest'
import { isNoSuffixMetric, isSummableMetric } from './metric-units'

describe('metric-units', () => {
  describe('isNoSuffixMetric', () => {
    it.each([
      'control_plane_count',
      'service_count',
      'route_count',
      'consumer_count',
      'plugin_count',
      'node_count',
      'count',
      'token count',
    ])('identifies %s as a no-suffix metric unit', (unit) => {
      expect(isNoSuffixMetric(unit)).toBe(true)
    })

    it.each([
      'bytes',
      'ms',
      'usd',
      '%',
      'count/minute',
    ])('does not identify %s as a no-suffix metric unit', (unit) => {
      expect(isNoSuffixMetric(unit)).toBe(false)
    })
  })

  describe('isSummableMetric', () => {
    describe('request and entity counts', () => {
      it.each([
        'request_count',
        'ai_request_count',
        'service_count',
        'node_count',
        'control_plane_count',
        'route_count',
        'consumer_count',
        'plugin_count',
      ])('identifies %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(true)
      })
    })

    describe('token counts', () => {
      it.each([
        'total_tokens',
        'prompt_tokens',
        'completion_tokens',
        'llm_embeddings_tokens',
      ])('identifies %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(true)
      })
    })

    describe('cost', () => {
      it.each([
        'cost',
        'llm_embeddings_cost',
      ])('identifies %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(true)
      })
    })

    describe('size sum metrics', () => {
      it.each([
        'request_size_sum',
        'response_size_sum',
        'a2a_response_size_sum',
        'mcp_response_size_sum',
        'mcp_response_body_size_sum',
        'record_bytes:sum',
      ])('identifies %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(true)
      })
    })

    describe('latency metrics', () => {
      it.each([
        'response_latency_p99',
        'response_latency_p95',
        'response_latency_p50',
        'response_latency_average',
        'upstream_latency_p99',
        'kong_latency_average',
      ])('does not identify %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(false)
      })
    })

    describe('size percentile and average metrics', () => {
      it.each([
        'response_size_p99',
        'response_size_p50',
        'response_size_average',
        'request_size_p99',
        'request_size_average',
      ])('does not identify %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(false)
      })
    })

    describe('other non-summable metrics', () => {
      it.each([
        'error_rate',
        'request_per_minute',
        'active_services',
      ])('does not identify %s as summable', (name) => {
        expect(isSummableMetric(name)).toBe(false)
      })
    })
  })
})
