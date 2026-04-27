import { generateSingleMetricTimeSeriesData } from '@kong-ui-public/analytics-utilities'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import useTimeseriesChartData from './useTimeseriesChartData'

describe('useTimeseriesChartData', () => {
  it('builds time-series datasets from explore data', () => {
    const exploreResult = generateSingleMetricTimeSeriesData(
      { name: 'request_count', unit: 'count' },
      { status_code: ['200', '500'] },
    )

    const chartData = useTimeseriesChartData({}, ref(exploreResult))

    expect(chartData.value.datasets).toHaveLength(2)
    expect(chartData.value.datasets[0]?.label).toBe('200')
    expect(chartData.value.datasets[0]?.data.length).toBeGreaterThan(0)
    expect(chartData.value.datasets[0]?.data[0]).toEqual(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }))
    expect(chartData.value.datasets[0]?.total).toEqual(expect.any(Number))
  })
})
