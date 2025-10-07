import { describe, it, expect } from 'vitest'
import useMetricUtils from './useMetricUtils'
import { ref } from 'vue'
import type { ExploreAggregations } from '@kong-ui-public/analytics-utilities'

describe('useMetricUtils', () => {
  it('generates legend data correctly', () => {

    const countryMetrics = ref({
      US: 100,
      CA: 200,
      MX: 300,
    })
    const metric = ref<ExploreAggregations>('request_count')

    const { legendData } = useMetricUtils({
      countryMetrics,
      metric,
    })

    const expectedLegendData = [

      { color: '#00819d', range: '> 240' },
      { color: '#00abd2', range: '193 - 240' },
      { color: '#00c8f4', range: '155 - 193' },
      { color: '#67e3ff', range: '124 - 155' },
      { color: '#b3f1ff', range: '< 124' },
    ]

    expect(legendData.value).toEqual(expectedLegendData)
  })

  it('latency metrics not truncated', () => {
    const countryMetrics = ref({
      US: 100,
      CA: 200,
      MX: 300,
    })
    const metric = ref<ExploreAggregations>('kong_latency_average')

    const { formatMetric } = useMetricUtils({
      countryMetrics,
      metric,
    })

    expect(formatMetric(10000)).toBe('10,000')
  })

  it('metrics truncated properly', () => {
    const countryMetrics = ref({
      US: 100,
      CA: 200,
      MX: 300,
    })
    const metric = ref<ExploreAggregations>('request_count')

    const { formatMetric } = useMetricUtils({
      countryMetrics,
      metric,
    })

    expect(formatMetric(10000)).toBe('10K')
  })

})
