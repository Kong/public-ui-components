import { describe, expect, it } from 'vitest'
import { isUnitlessMetricUnit } from './metric-units'

describe('metric-units', () => {
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
  ])('does not match %s as a regular unit', (unit) => {
    expect(isUnitlessMetricUnit(unit)).toBe(false)
  })
})
