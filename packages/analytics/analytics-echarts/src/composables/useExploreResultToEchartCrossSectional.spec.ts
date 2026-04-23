import { generateCrossSectionalData } from '@kong-ui-public/analytics-utilities'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import useExploreResultToDatasets from './useExploreResultToDatasets'
import useExploreResultToEChartCrossSectional from './useExploreResultToEchartCrossSectional'

describe('useExploreResultToEChartCrossSectional', () => {
  it('builds chart series from cross-sectional explore data', () => {
    const exploreResult = generateCrossSectionalData(
      [{ name: 'request_count', unit: 'count' }],
      { status_code: ['200', '500'] },
    )

    const chartData = useExploreResultToDatasets({}, ref(exploreResult))

    const { option } = useExploreResultToEChartCrossSectional({
      chartData,
      chartType: ref('horizontal_bar'),
      stacked: ref(false),
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

    const series = option.value.series as Array<{ data: number[] }>

    expect(series).toHaveLength(2)
    expect(series[0]?.data.length).toBeGreaterThan(0)
  })
})
