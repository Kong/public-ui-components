import { describe, expect, it } from 'vitest'
import { isUnitlessMetricUnit, isSummableMetricUnit, isSummableMetricName } from './metric-units'

describe('metric-units', () => {
  describe('isUnitlessMetricUnit', () => {
    it.each([
      'control_plane_count',
      'service_count',
      'route_count',
      'consumer_count',
      'plugin_count',
      'node_count',
      'usd',
    ])('identifies %s as a unitless metric unit', (unit) => {
      expect(isUnitlessMetricUnit(unit)).toBe(true)
    })

    it.each([
      'count',
      'bytes',
    ])('does not identify %s as a unitless metric unit', (unit) => {
      expect(isUnitlessMetricUnit(unit)).toBe(false)
    })
  })

  describe('isSummableMetricUnit', () => {
    it.each([
      'count',
      'usd',
      'token count',
      'control_plane_count',
      'service_count',
      'route_count',
      'consumer_count',
      'plugin_count',
      'node_count',
    ])('identifies %s as a summable metric unit', (unit) => {
      expect(isSummableMetricUnit(unit)).toBe(true)
    })

    it.each([
      'ms',
      'bytes',
      '%',
      'count/minute',
      'requests',
    ])('does not identify %s as a summable metric unit', (unit) => {
      expect(isSummableMetricUnit(unit)).toBe(false)
    })
  })

  describe('isSummableMetricName', () => {
    it.each([
      'request_size_sum',
      'response_size_sum',
      'a2a_response_size_sum',
      'mcp_response_size_sum',
      'mcp_response_body_size_sum',
      'record_bytes:sum',
    ])('identifies %s as a summable metric name', (name) => {
      expect(isSummableMetricName(name)).toBe(true)
    })

    it.each([
      'request_size_p99',
      'request_size_average',
      'response_size_p50',
      'request_count',
    ])('does not identify %s as a summable metric name', (name) => {
      expect(isSummableMetricName(name)).toBe(false)
    })
  })
})
