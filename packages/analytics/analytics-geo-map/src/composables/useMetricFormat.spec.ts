import type { MetricUnits } from '../types'
import { describe, it, expect } from 'vitest'
import useMetricFormat from './useMetricFormat'
import { ref } from 'vue'

describe('useMetricFormat', () => {
  it('does not approximate by default', () => {
    const unit = ref<MetricUnits>('ms')

    const { formatMetric } = useMetricFormat({ unit })

    expect(formatMetric(10000)).toBe('10,000 ms')
  })

  it('approximates value if approximate option provided', () => {
    const unit = ref<MetricUnits>('count')

    const { formatMetric } = useMetricFormat({ unit })

    expect(formatMetric(10000, {
      approximate: true,
    })).toBe('10K requests')
  })

  it('formats bytes metric correctly', () => {
    const unit = ref<MetricUnits>('bytes')

    const { formatMetric, formatMetricRange } = useMetricFormat({ unit })

    expect(formatMetric(1e6)).toBe('1 MB')
    expect(formatMetricRange(1e6, 5e6)).toBe('1 MB - 5 MB')
  })
})
