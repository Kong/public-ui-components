import { describe, it, expect } from 'vitest'
import useMetricUtils from './useMetricUtils'
import { ref } from 'vue'
import { COUNTRIES, type ExploreAggregations } from '@kong-ui-public/analytics-utilities'
import { KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER } from '@kong/design-tokens'
import { colors } from './useMetricUtils'
import type { MetricUnits } from '../types'

describe('useMetricUtils', () => {
  it.each([
    [[10], 1],
    [[10, 20], 2],
    [[10, 20, 30], 3],
    [[10, 20, 30, 40], 5],
    [[10, 20, 30, 40, 50], 5],
    [[10, 20, 30, 40, 50, 60], 5],
    [[], 0],
  ])('generates correct length scale for %# datapoints', (datapoints, expectedScaleLength) => {
    const countryMetrics = ref<Record<string, number>>({})
    datapoints.forEach((value, index) => {
      const countryCode = COUNTRIES[index].code
      countryMetrics.value[countryCode] = value
    })
    const metric = ref<ExploreAggregations>('request_count')
    const unit = ref<MetricUnits>('count')

    const { scale } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })
    expect(scale.value.length).toBe(expectedScaleLength)
  })

  it('generates one legend entry for one datapoint', () => {
    const countryMetrics = ref({
      US: 1000,
    })
    const metric = ref<ExploreAggregations>('request_count')
    const unit = ref<MetricUnits>('count')

    const { legendData } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })

    const expectedLegendData = [
      { color: colors[0], range: '1K requests' },
    ]

    expect(legendData.value).toEqual(expectedLegendData)
  })

  it('generates sane bins for provided metrics, gets correct color for provided metric', () => {
    const countryMetrics = ref({
      GB: 1000,
      ES: 1500,
      CA: 2000,
      KR: 2500,
      MX: 3000,
      DE: 3500,
      US: 4000,
      RO: 4500,
      FR: 5000,
    })
    const metric = ref<ExploreAggregations>('request_count')
    const unit = ref<MetricUnits>('count')

    const { legendData, getColor } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })

    const expectedLegendData = [
      { color: colors[0], range: '> 3.6K' },
      { color: colors[1], range: '2.6K - 3.6K' },
      { color: colors[2], range: '1.9K - 2.6K' },
      { color: colors[3], range: '1.3K - 1.9K' },
      { color: colors[4], range: '< 1.3K' },
    ]

    expect(legendData.value).toEqual(expectedLegendData)

    expect(getColor(10000)).toBe(colors[0])
    expect(getColor(3400)).toBe(colors[1])
    expect(getColor(2400)).toBe(colors[2])
    expect(getColor(1900)).toBe(colors[3])
    expect(getColor(1000)).toBe(colors[4])
    expect(getColor(20)).toBe(colors[4])
    expect(getColor(0)).toBe(KUI_COLOR_BACKGROUND_NEUTRAL_WEAKER)
  })

  it('latency metrics not truncated', () => {
    const countryMetrics = ref({
      US: 100,
      CA: 200,
      MX: 300,
    })
    const metric = ref<ExploreAggregations>('kong_latency_average')
    const unit = ref<MetricUnits>('ms')

    const { formatMetric } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })

    expect(formatMetric(10000)).toBe('10,000 ms')
  })

  it('metrics truncated properly', () => {
    const countryMetrics = ref({
      US: 100,
      CA: 200,
      MX: 300,
    })
    const metric = ref<ExploreAggregations>('request_count')
    const unit = ref<MetricUnits>('count')

    const { formatMetric } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })

    expect(formatMetric(10000)).toBe('10K requests')
  })

  it('ignores country codes that are not in the COUNTRIES list', () => {
    const countryMetrics = ref({
      US: 1000,
      empty: 2000,
      YY: 3000,
    })
    const metric = ref<ExploreAggregations>('request_count')
    const unit = ref<MetricUnits>('count')

    const { legendData } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })

    // Will generate just one legend item since the other two country codes are invalid and will be ignored
    expect(legendData.value).toEqual([
      {
        'color': '#00819d',
        'range': '1K requests',
      },
    ])
  })

  it('formats bytes metric correctly', () => {
    const countryMetrics = ref({
      US: 100,
      CA: 200,
      MX: 300,
    })
    const metric = ref<ExploreAggregations>('request_size_average')
    const unit = ref<MetricUnits>('bytes')

    const { formatMetric, formatMetricRange } = useMetricUtils({
      countryMetrics,
      metric,
      unit,
    })

    expect(formatMetric(1e6)).toBe('1 MB')
    expect(formatMetricRange(1e6, 5e6)).toBe('1 MB - 5 MB')
  })
})
