import { describe, expect, it } from 'vitest'
import { isUnitlessMetricUnit, isSummableMetricUnit } from './metric-units'

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
      'requests',
      'usd',
      'token count',
    ])('identifies %s as a summable metric unit', (unit) => {
      expect(isSummableMetricUnit(unit)).toBe(true)
    })

    it.each([
      'ms',
      'bytes',
      '%',
      'count/minute',
    ])('does not identify %s as a summable metric unit', (unit) => {
      expect(isSummableMetricUnit(unit)).toBe(false)
    })
  })
})
