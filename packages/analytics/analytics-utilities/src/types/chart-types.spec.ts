import { describe, expect, it } from 'vitest'
import { isMetricSupported } from './chart-types'

describe('isMetricSupported', () => {
  it.each(['response_latency_average', 'response_latency_p99', 'error_rate', 'response_latency_max', 'request_per_minute'])(
    'rejects non-additive metric %s for treemap',
    (metric) => {
      expect(isMetricSupported('treemap', metric)).toBe(false)
    },
  )

  it('allows additive metrics for treemap', () => {
    expect(isMetricSupported('treemap', 'request_count')).toBe(true)
  })

  it('allows any metric for other chart types', () => {
    expect(isMetricSupported('heatmap', 'response_latency_average')).toBe(true)
    expect(isMetricSupported('scatter', 'error_rate')).toBe(true)
  })
})
