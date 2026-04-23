import { generateCrossSectionalData } from '@kong-ui-public/analytics-utilities'
import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import useCrossSectionalChartData from './useCrossSectionalChartData'
import useCrossSectionalChartOption from './useCrossSectionalChartOption'

describe('useCrossSectionalChartOption', () => {
  it('builds chart series from cross-sectional explore data', () => {
    const exploreResult = generateCrossSectionalData(
      [{ name: 'request_count', unit: 'count' }],
      { status_code: ['200', '500'] },
    )

    const chartData = useCrossSectionalChartData({}, ref(exploreResult))

    const { option } = useCrossSectionalChartOption({
      chartData,
      chartType: ref('horizontal_bar'),
      chartWidth: ref(640),
      chartHeight: ref(400),
      scrollWindow: ref(null),
      showAnnotations: ref(true),
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

  it('adds data zoom when the chart viewport cannot fit all horizontal bars', () => {
    const exploreResult = generateCrossSectionalData(
      [{ name: 'request_count', unit: 'count' }],
      { status_code: Array.from({ length: 20 }, (_, index) => `${index}`) },
    )

    const chartData = useCrossSectionalChartData({}, ref(exploreResult))

    const { option } = useCrossSectionalChartOption({
      chartData,
      chartType: ref('horizontal_bar'),
      chartWidth: ref(640),
      chartHeight: ref(200),
      scrollWindow: ref({ anchorLabel: '4', visibleCategoryCount: 7 }),
      showAnnotations: ref(true),
      stacked: ref(false),
      metricUnit: ref('count'),
      selectedLabels: ref(Object.fromEntries(chartData.value.datasets.map((dataset) => [dataset.label || '', true]))),
      tooltipState: ref({
        interactionMode: 'idle',
        entries: [],
        visible: false,
        top: 0,
        left: 0,
      }),
    })

    const dataZoom = option.value.dataZoom as Array<{ yAxisIndex?: number, zoomLock?: boolean, startValue?: number, type?: string }>

    expect(dataZoom).toEqual([
      expect.objectContaining({
        type: 'slider',
        yAxisIndex: 0,
        zoomLock: true,
        startValue: 4,
      }),
      expect.objectContaining({
        type: 'inside',
        yAxisIndex: 0,
        startValue: 4,
      }),
    ])
  })

  it('preserves the same visible category after data reorder', () => {
    const exploreResult = ref({
      meta: {
        metric_names: ['request_count'],
        display: {
          route: {
            alpha: { name: 'Alpha' },
            beta: { name: 'Beta' },
            gamma: { name: 'Gamma' },
            delta: { name: 'Delta' },
          },
        },
      },
      data: [
        { event: { route: 'alpha', request_count: 40 } },
        { event: { route: 'beta', request_count: 30 } },
        { event: { route: 'gamma', request_count: 20 } },
        { event: { route: 'delta', request_count: 10 } },
      ],
    })

    const chartData = useCrossSectionalChartData({}, exploreResult)
    const scrollWindow = ref({ anchorLabel: 'Beta', visibleCategoryCount: 2 })
    const { option } = useCrossSectionalChartOption({
      chartData,
      chartType: ref('horizontal_bar'),
      chartWidth: ref(640),
      chartHeight: ref(52),
      scrollWindow,
      showAnnotations: ref(true),
      stacked: ref(false),
      metricUnit: ref('count'),
      selectedLabels: ref(Object.fromEntries(chartData.value.datasets.map((dataset) => [dataset.label || '', true]))),
      tooltipState: ref({
        interactionMode: 'idle',
        entries: [],
        visible: false,
        top: 0,
        left: 0,
      }),
    })

    expect((option.value.dataZoom as Array<{ startValue: number, endValue: number }>)[0]).toEqual(expect.objectContaining({
      startValue: 1,
      endValue: 2,
    }))

    exploreResult.value = {
      ...exploreResult.value,
      data: [
        { event: { route: 'delta', request_count: 100 } },
        { event: { route: 'alpha', request_count: 40 } },
        { event: { route: 'beta', request_count: 30 } },
        { event: { route: 'gamma', request_count: 20 } },
      ],
    }

    expect(chartData.value.labels).toEqual(['Delta', 'Alpha', 'Beta', 'Gamma'])
    expect((option.value.dataZoom as Array<{ startValue: number, endValue: number }>)[0]).toEqual(expect.objectContaining({
      startValue: 2,
      endValue: 3,
    }))
  })

  it('suppresses annotations when the chart becomes scrollable and restores them when it grows', () => {
    const exploreResult = generateCrossSectionalData(
      [{ name: 'request_count', unit: 'count' }],
      { status_code: Array.from({ length: 12 }, (_, index) => `${index}`) },
    )
    const chartData = useCrossSectionalChartData({}, ref(exploreResult))
    const chartHeight = ref(400)

    const { option } = useCrossSectionalChartOption({
      chartData,
      chartType: ref('horizontal_bar'),
      chartWidth: ref(640),
      chartHeight,
      scrollWindow: ref(null),
      showAnnotations: ref(true),
      stacked: ref(false),
      metricUnit: ref('count'),
      selectedLabels: ref(Object.fromEntries(chartData.value.datasets.map((dataset) => [dataset.label || '', true]))),
      tooltipState: ref({
        interactionMode: 'idle',
        entries: [],
        visible: false,
        top: 0,
        left: 0,
      }),
    })

    const largeSeries = option.value.series as Array<{
      label: { show: boolean }
      labelLayout: (params: { rect?: { width?: number }, dataIndex?: number }) => { hide: boolean }
    }>

    expect(largeSeries[0]?.label.show).toBe(true)
    expect(largeSeries[0]?.labelLayout({ rect: { width: 240 }, dataIndex: 0 })).toEqual({ hide: false })

    chartHeight.value = 260

    const smallSeries = option.value.series as Array<{
      label: { show: boolean }
      labelLayout: (params: { rect?: { width?: number }, dataIndex?: number }) => { hide: boolean }
    }>

    expect(smallSeries[0]?.label.show).toBe(false)
    expect(smallSeries[0]?.labelLayout({ rect: { width: 240 }, dataIndex: 0 })).toEqual({ hide: true })
  })

  it('keeps annotations off when explicitly disabled', () => {
    const exploreResult = generateCrossSectionalData(
      [{ name: 'request_count', unit: 'count' }],
      { status_code: ['200', '500'] },
    )
    const chartData = useCrossSectionalChartData({}, ref(exploreResult))

    const { option } = useCrossSectionalChartOption({
      chartData,
      chartType: ref('horizontal_bar'),
      chartWidth: ref(640),
      chartHeight: ref(400),
      scrollWindow: ref(null),
      showAnnotations: ref(false),
      stacked: ref(false),
      metricUnit: ref('count'),
      selectedLabels: ref(Object.fromEntries(chartData.value.datasets.map((dataset) => [dataset.label || '', true]))),
      tooltipState: ref({
        interactionMode: 'idle',
        entries: [],
        visible: false,
        top: 0,
        left: 0,
      }),
    })

    const series = option.value.series as Array<{
      label: { show: boolean }
      labelLayout: (params: { rect?: { width?: number }, dataIndex?: number }) => { hide: boolean }
    }>

    expect(series[0]?.label.show).toBe(false)
    expect(series[0]?.labelLayout({ rect: { width: 240 }, dataIndex: 0 })).toEqual({ hide: true })
  })
})
