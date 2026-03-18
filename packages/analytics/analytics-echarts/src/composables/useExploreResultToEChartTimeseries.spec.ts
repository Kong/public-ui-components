import { generateSingleMetricTimeSeriesData, msToGranularity } from '@kong-ui-public/analytics-utilities'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import useExploreResultToTimeDatasets from './useExploreResultToTimeDatasets'
import useExploreResultToEChartTimeseries from './useExploreResultToEChartTimeseries'

describe('useExploreResultToEChartTimeseries', () => {
  it('builds chart series from ISO start/end values', () => {
    const exploreResult = generateSingleMetricTimeSeriesData(
      { name: 'request_count', unit: 'count' },
      { status_code: ['200', '500'] },
    )

    const chartData = useExploreResultToTimeDatasets({}, ref(exploreResult))

    const { option } = useExploreResultToEChartTimeseries({
      chartData,
      chartType: ref('timeseries_line'),
      granularity: ref(msToGranularity(exploreResult.meta.granularity_ms) || 'hourly'),
      stacked: ref(false),
      threshold: ref(undefined),
      metricUnit: ref('count'),
      selectedLabels: ref({
        '200': true,
        '500': true,
      }),
      tooltipState: ref({
        interactionMode: 'idle',
        entries: [],
        visible: false,
        top: 0,
        left: 0,
      }),
    })

    const series = option.value.series as Array<{ data: Array<[number, number]> }>

    expect(series).toHaveLength(2)
    expect(series[0]?.data.length).toBeGreaterThan(0)
  })
})

