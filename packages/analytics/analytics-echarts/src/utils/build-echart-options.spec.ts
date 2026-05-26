import { describe, expect, it } from 'vitest'
import type { TooltipState, KChartData } from '../types'
import { buildCrossSectionOption, buildTimeseriesOption } from './build-echart-options'
import { formatTooltipTimestampByGranularity } from './format-timestamps'

const createTooltipState = (): TooltipState => ({
  interactionMode: 'idle',
  entries: [],
  visible: false,
  top: 0,
  left: 0,
})

const createFormatter = (chartData: KChartData) => {
  const tooltipState = createTooltipState()
  const option = buildCrossSectionOption({
    chartData,
    chartType: 'horizontal_bar',
    chartWidth: 640,
    chartHeight: 400,
    scrollWindow: null,
    showAnnotations: true,
    stacked: false,
    tooltipState,
    tooltipTitle: 'Tooltip title',
    tooltipMetricDisplay: 'Request count',
    dimensionAxisTitle: 'Status code',
    metricAxisTitle: 'Request count',
    selectedLabels: Object.fromEntries(chartData.datasets.map((dataset) => [dataset.label || '', true])),
    formatValue: (value: number) => `${value} requests`,
  })
  const formatter = (option.tooltip as { formatter: (params: unknown) => string }).formatter

  return {
    formatter,
    tooltipState,
  }
}

const createDonutFormatter = (chartData: KChartData) => {
  const tooltipState = createTooltipState()
  const option = buildCrossSectionOption({
    chartData,
    chartType: 'donut',
    chartWidth: 640,
    chartHeight: 400,
    scrollWindow: null,
    showAnnotations: true,
    stacked: false,
    tooltipState,
    tooltipTitle: 'Tooltip title',
    tooltipMetricDisplay: 'Request count',
    dimensionAxisTitle: 'Status code',
    metricAxisTitle: 'Request count',
    selectedLabels: Object.fromEntries(chartData.datasets.map((dataset) => [dataset.label || '', true])),
    formatValue: (value: number) => `${value} requests`,
  })
  const formatter = (option.tooltip as { formatter: (params: unknown) => string }).formatter

  return {
    formatter,
    tooltipState,
  }
}

const createTimeseriesFormatter = (chartData: KChartData) => {
  const tooltipState = createTooltipState()
  const option = buildTimeseriesOption({
    chartData,
    chartType: 'timeseries_line',
    stacked: false,
    granularity: 'hourly',
    tooltipState,
    tooltipTitle: 'Tooltip title',
    tooltipMetricDisplay: 'Request count',
    dimensionAxisTitle: '@timestamp per hour',
    metricAxisTitle: 'Request count',
    selectedLabels: Object.fromEntries(chartData.datasets.map((dataset) => [dataset.label || '', true])),
    formatValue: (value: number) => `${value} requests`,
    thresholdLabelFormatter: () => '',
  })
  const formatter = (option.tooltip as { formatter: (params: unknown) => string }).formatter

  return {
    formatter,
    tooltipState,
  }
}

describe('buildCrossSectionOption tooltip formatter', () => {
  it('uses the hovered category for single-dimension bar chart subtitles and filters zero-value series', () => {
    const chartData: KChartData = {
      labels: ['Request count'],
      isMultiDimension: false,
      datasets: [
        {
          label: '200',
          rawDimension: '200',
          backgroundColor: '#7e57c2',
          borderColor: '#7e57c2',
          data: [25],
        },
        {
          label: '500',
          rawDimension: '500',
          backgroundColor: '#ef5350',
          borderColor: '#ef5350',
          data: [0],
        },
      ],
    }
    const { formatter, tooltipState } = createFormatter(chartData)

    formatter([
      {
        seriesName: '200',
        value: 25,
        color: '#7e57c2',
        axisValueLabel: 'Request count',
      },
      {
        seriesName: '500',
        value: 0,
        color: '#ef5350',
        axisValueLabel: 'Request count',
      },
    ])

    expect(tooltipState.subtitle).toBe('200')
    expect(tooltipState.entries).toEqual([
      expect.objectContaining({
        label: '200',
        value: '25 requests',
        rawValue: 25,
      }),
    ])
  })

  it('uses the hovered axis label for multi-dimension bar chart subtitles', () => {
    const chartData: KChartData = {
      labels: ['200', '500'],
      isMultiDimension: true,
      datasets: [
        {
          label: 'v1',
          rawDimension: 'v1',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: [25, 10],
        },
      ],
    }
    const { formatter, tooltipState } = createFormatter(chartData)

    formatter([
      {
        seriesName: 'v1',
        value: 25,
        color: '#42a5f5',
        axisValueLabel: '200',
      },
    ])

    expect(tooltipState.subtitle).toBe('200')
    expect(tooltipState.entries).toEqual([
      expect.objectContaining({
        label: 'v1',
        value: '25 requests',
        rawValue: 25,
      }),
    ])
  })

  it('respects a custom tooltip sort function', () => {
    const chartData: KChartData = {
      labels: ['Request count'],
      isMultiDimension: false,
      datasets: [
        {
          label: '200',
          rawDimension: '200',
          backgroundColor: '#7e57c2',
          borderColor: '#7e57c2',
          data: [25],
        },
        {
          label: '500',
          rawDimension: '500',
          backgroundColor: '#ef5350',
          borderColor: '#ef5350',
          data: [10],
        },
      ],
    }
    const tooltipState = createTooltipState()
    const option = buildCrossSectionOption({
      chartData,
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 400,
      scrollWindow: null,
      showAnnotations: true,
      stacked: false,
      tooltipState,
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Status code',
      metricAxisTitle: 'Request count',
      selectedLabels: Object.fromEntries(chartData.datasets.map((dataset) => [dataset.label || '', true])),
      formatValue: (value: number) => `${value} requests`,
      chartTooltipSortFn: (a, b) => a.rawValue - b.rawValue,
    })
    const formatter = (option.tooltip as { formatter: (params: unknown) => string }).formatter

    formatter([
      {
        seriesName: '200',
        value: 25,
        color: '#7e57c2',
        axisValueLabel: 'Request count',
      },
      {
        seriesName: '500',
        value: 10,
        color: '#ef5350',
        axisValueLabel: 'Request count',
      },
    ])

    expect(tooltipState.entries.map(({ label }) => label)).toEqual(['500', '200'])
  })

  it('truncates horizontal category labels and hides value labels that do not fit in the bar', () => {
    const chartData: KChartData = {
      labels: ['A very long route label that should be truncated'],
      datasets: [
        {
          label: 'route-1',
          rawDimension: 'route-1',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: [12],
        },
      ],
    }

    const option = buildCrossSectionOption({
      chartData,
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 400,
      scrollWindow: null,
      showAnnotations: true,
      stacked: true,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { 'route-1': true },
      formatValue: (value: number) => `${value} requests`,
    })

    const yAxis = option.yAxis as {
      axisLabel: { formatter: (value: string) => string, width: number, overflow: string }
      inverse: boolean
      nameLocation: string
      nameRotate: number
      nameGap: number
    }
    const xAxis = option.xAxis as { name: string }
    const grid = option.grid as { left: number, bottom: number }
    const media = option.media as Array<{
      query: { maxWidth?: number, maxHeight?: number }
      option: {
        grid?: { left?: number, right?: number, top?: number, bottom?: number }
        xAxis?: { show?: boolean, splitNumber?: number }
        yAxis?: { show?: boolean }
      }
    }>
    const series = option.series as Array<{
      labelLayout: (params: {
        rect?: { width?: number, height?: number }
        dataIndex?: number
      }) => { hide: boolean }
    }>

    expect(grid.left).toBe(0)
    expect(grid.bottom).toBe(28)
    expect(option.dataZoom).toBeUndefined()
    expect(xAxis.name).toBe('Request count')
    expect(yAxis.axisLabel.width).toBe(112)
    expect(yAxis.axisLabel.overflow).toBe('truncate')
    expect(yAxis.inverse).toBe(true)
    expect(yAxis.nameLocation).toBe('middle')
    expect(yAxis.nameRotate).toBe(90)
    expect(yAxis.nameGap).toBe(140)
    expect(yAxis.axisLabel.formatter('A very long route label that should be truncated')).toBe('A very long route la...')
    expect(media).toEqual([
      expect.objectContaining({
        query: { maxHeight: 200 },
        option: expect.objectContaining({
          xAxis: { show: false },
          yAxis: { show: false },
        }),
      }),
      expect.objectContaining({
        query: { maxWidth: 500 },
        option: expect.objectContaining({
          grid: { left: 0, right: 44, top: 20, bottom: 28 },
          xAxis: expect.objectContaining({ splitNumber: 4 }),
          yAxis: { show: false },
        }),
      }),
      expect.objectContaining({
        query: { maxWidth: 400 },
        option: expect.objectContaining({
          grid: { left: 0, right: 44, top: 20, bottom: 28 },
          xAxis: { show: false },
          yAxis: { show: false },
        }),
      }),
    ])
    expect(series[0].labelLayout({ rect: { width: 40 }, dataIndex: 0 })).toEqual({ hide: true })
    expect(series[0].labelLayout({ rect: { width: 120 }, dataIndex: 0 })).toEqual({ hide: false })
  })

  it('keeps responsive vertical bar grid spacing large enough for the zoom slider', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: Array.from({ length: 20 }, (_, index) => `Route ${index}`),
        datasets: [{
          label: 'Requests',
          rawDimension: 'request_count',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: Array.from({ length: 20 }, (_, index) => index + 1),
        }],
      },
      chartType: 'vertical_bar',
      chartWidth: 200,
      chartHeight: 400,
      scrollWindow: {
        startValue: 4,
        endValue: 10,
      },
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { Requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const grid = option.grid as { bottom: number }
    const media = option.media as Array<{
      query: { maxWidth?: number }
      option: {
        grid?: { bottom?: number }
        xAxis?: { show?: boolean, axisLabel?: { show?: boolean } }
        yAxis?: { show?: boolean }
      }
    }>

    expect(grid.bottom).toBe(52)
    expect(option.dataZoom).toEqual([
      expect.objectContaining({
        type: 'slider',
        xAxisIndex: 0,
        startValue: 4,
        endValue: 10,
      }),
      expect.objectContaining({
        type: 'inside',
        xAxisIndex: 0,
        startValue: 4,
        endValue: 10,
      }),
    ])
    expect(media).toEqual([
      expect.objectContaining({
        query: { maxHeight: 200 },
      }),
      expect.objectContaining({
        query: { maxWidth: 500 },
        option: expect.objectContaining({
          grid: { bottom: 52, top: 24, left: 12, right: 12 },
          xAxis: { axisLabel: { show: false } },
        }),
      }),
      expect.objectContaining({
        query: { maxWidth: 400 },
        option: expect.objectContaining({
          grid: { bottom: 52, left: 0, right: 12 },
          xAxis: { show: false },
          yAxis: { show: false },
        }),
      }),
    ])
  })

  it('adds extra space for vertical bar axis titles and hides oversized value labels', () => {
    const chartData: KChartData = {
      labels: ['A very long route label that should be truncated'],
      datasets: [
        {
          label: 'route-1',
          rawDimension: 'route-1',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: [6106379],
        },
      ],
    }

    const option = buildCrossSectionOption({
      chartData,
      chartType: 'vertical_bar',
      chartWidth: 640,
      chartHeight: 400,
      scrollWindow: null,
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { 'route-1': true },
      formatValue: (value: number) => `${value} requests`,
    })

    const xAxis = option.xAxis as {
      axisLabel: { formatter: (value: string) => string, width: number, overflow: string }
      nameGap: number
    }
    const yAxis = option.yAxis as { nameGap: number }
    const grid = option.grid as { left: number, bottom: number }
    const series = option.series as Array<{
      labelLayout: (params: {
        rect?: { width?: number, height?: number }
        dataIndex?: number
      }) => { hide: boolean }
    }>

    expect(grid.left).toBe(88)
    expect(grid.bottom).toBe(32)
    expect(option.dataZoom).toBeUndefined()
    expect(xAxis.axisLabel.width).toBe(96)
    expect(xAxis.axisLabel.overflow).toBe('truncate')
    expect(xAxis.nameGap).toBe(36)
    expect(yAxis.nameGap).toBe(76)
    expect(xAxis.axisLabel.formatter('A very long route label that should be truncated')).toBe('A very long route la...')
    expect(series[0].labelLayout({ rect: { height: 60, width: 48 }, dataIndex: 0 })).toEqual({ hide: true })
    expect(series[0].labelLayout({ rect: { height: 120, width: 96 }, dataIndex: 0 })).toEqual({ hide: false })
  })

  it('turns bar labels off when annotations are disabled', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: ['Route 1'],
        datasets: [{
          label: 'Requests',
          rawDimension: 'request_count',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: [25],
        }],
      },
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 400,
      scrollWindow: null,
      showAnnotations: false,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { Requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const series = option.series as Array<{
      label: { show: boolean }
      labelLayout: (params: { rect?: { width?: number }, dataIndex?: number }) => { hide: boolean }
    }>

    expect(series[0]?.label.show).toBe(false)
    expect(series[0]?.labelLayout({ rect: { width: 240 }, dataIndex: 0 })).toEqual({ hide: true })
  })

  it('suppresses bar labels when the chart is scrollable even if annotations are requested', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: Array.from({ length: 20 }, (_, index) => `route-${index}`),
        datasets: [{
          label: 'Requests',
          rawDimension: 'request_count',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: Array.from({ length: 20 }, (_, index) => index + 1),
        }],
      },
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 260,
      scrollWindow: null,
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { Requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const series = option.series as Array<{
      label: { show: boolean }
      labelLayout: (params: { rect?: { width?: number }, dataIndex?: number }) => { hide: boolean }
    }>

    expect(series[0]?.label.show).toBe(false)
    expect(series[0]?.labelLayout({ rect: { width: 240 }, dataIndex: 0 })).toEqual({ hide: true })
  })

  it('uses the same responsive breakpoint queries for timeseries and cross-sectional charts', () => {
    const crossSectionOption = buildCrossSectionOption({
      chartData: {
        labels: ['route-1'],
        datasets: [
          {
            label: 'route-1',
            rawDimension: 'route-1',
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            data: [12],
          },
        ],
      },
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 400,
      scrollWindow: null,
      showAnnotations: true,
      stacked: true,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { 'route-1': true },
      formatValue: (value: number) => `${value} requests`,
    })

    const timeseriesOption = buildTimeseriesOption({
      chartData: {
        datasets: [
          {
            label: '200',
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            data: [
              { x: Date.UTC(2024, 0, 1, 0, 0), y: 10 },
              { x: Date.UTC(2024, 0, 1, 1, 0), y: 20 },
            ],
          },
        ],
      },
      chartType: 'timeseries_line',
      stacked: false,
      granularity: 'hourly',
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: '@timestamp per hour',
      metricAxisTitle: 'Request count',
      selectedLabels: { '200': true },
      formatValue: (value: number) => `${value} requests`,
      thresholdLabelFormatter: () => '',
    })

    const crossSectionQueries = (crossSectionOption.media as Array<{ query: { maxWidth?: number, maxHeight?: number } }>).map(({ query }) => query)
    const timeseriesQueries = (timeseriesOption.media as Array<{ query: { maxWidth?: number, maxHeight?: number } }>).map(({ query }) => query)

    expect(crossSectionQueries).toEqual(timeseriesQueries)
    expect(crossSectionQueries).toEqual([
      { maxHeight: 200 },
      { maxWidth: 500 },
      { maxWidth: 400 },
    ])
  })

  it('adds vertical data zoom for crowded horizontal bar charts', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: Array.from({ length: 20 }, (_, index) => `route-${index}`),
        datasets: [
          {
            label: 'requests',
            rawDimension: 'requests',
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            data: Array.from({ length: 20 }, (_, index) => index + 1),
          },
        ],
      },
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 200,
      scrollWindow: null,
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const dataZoom = option.dataZoom as Array<{
      type?: string
      yAxisIndex?: number
      zoomLock?: boolean
      orient?: string
      brushSelect?: boolean
      startValue?: number
      endValue?: number
      zoomOnMouseWheel?: boolean
      moveOnMouseWheel?: boolean
      moveOnMouseMove?: boolean
      showDataShadow?: boolean
    }>
    const grid = option.grid as { right: number }

    expect(dataZoom).toEqual([
      expect.objectContaining({
        type: 'slider',
        yAxisIndex: 0,
        orient: 'vertical',
        brushSelect: false,
        showDataShadow: false,
        startValue: 0,
        endValue: 6,
      }),
      expect.objectContaining({
        type: 'inside',
        yAxisIndex: 0,
        startValue: 0,
        endValue: 6,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      }),
    ])
    expect(dataZoom[0]).not.toHaveProperty('zoomLock')
    expect(grid.right).toBe(44)
  })

  it('adds horizontal data zoom for crowded vertical bar charts', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: Array.from({ length: 40 }, (_, index) => `route-${index}`),
        datasets: [
          {
            label: 'requests',
            rawDimension: 'requests',
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            data: Array.from({ length: 40 }, (_, index) => index + 1),
          },
        ],
      },
      chartType: 'vertical_bar',
      chartWidth: 200,
      chartHeight: 400,
      scrollWindow: null,
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const dataZoom = option.dataZoom as Array<{
      type?: string
      xAxisIndex?: number
      zoomLock?: boolean
      brushSelect?: boolean
      startValue?: number
      endValue?: number
      zoomOnMouseWheel?: boolean
      moveOnMouseWheel?: boolean
      moveOnMouseMove?: boolean
      showDataShadow?: boolean
    }>
    const grid = option.grid as { bottom: number }

    expect(dataZoom).toEqual([
      expect.objectContaining({
        type: 'slider',
        xAxisIndex: 0,
        brushSelect: false,
        showDataShadow: false,
        startValue: 0,
        endValue: 6,
      }),
      expect.objectContaining({
        type: 'inside',
        xAxisIndex: 0,
        startValue: 0,
        endValue: 6,
        zoomOnMouseWheel: false,
        moveOnMouseWheel: true,
        moveOnMouseMove: false,
      }),
    ])
    expect(dataZoom[0]).not.toHaveProperty('zoomLock')
    expect(grid.bottom).toBe(52)
  })

  it('uses a seeded scroll window when rebuilding a crowded bar chart', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: Array.from({ length: 20 }, (_, index) => `route-${index}`),
        datasets: [
          {
            label: 'requests',
            rawDimension: 'requests',
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            data: Array.from({ length: 20 }, (_, index) => index + 1),
          },
        ],
      },
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 200,
      scrollWindow: { startValue: 5, endValue: 11 },
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const dataZoom = option.dataZoom as Array<{ startValue?: number, endValue?: number }>

    expect(dataZoom).toEqual([
      expect.objectContaining({ startValue: 5, endValue: 11 }),
      expect.objectContaining({ startValue: 5, endValue: 11 }),
    ])
  })

  it('clamps an out-of-range seeded window to the current category range', () => {
    const option = buildCrossSectionOption({
      chartData: {
        labels: Array.from({ length: 20 }, (_, index) => `route-${index}`),
        datasets: [
          {
            label: 'requests',
            rawDimension: 'requests',
            backgroundColor: '#42a5f5',
            borderColor: '#42a5f5',
            data: Array.from({ length: 20 }, (_, index) => index + 1),
          },
        ],
      },
      chartType: 'horizontal_bar',
      chartWidth: 640,
      chartHeight: 200,
      scrollWindow: { startValue: 18, endValue: 30 },
      showAnnotations: true,
      stacked: false,
      tooltipState: createTooltipState(),
      tooltipTitle: 'Tooltip title',
      tooltipMetricDisplay: 'Request count',
      dimensionAxisTitle: 'Route',
      metricAxisTitle: 'Request count',
      selectedLabels: { requests: true },
      formatValue: (value: number) => `${value} requests`,
    })

    const dataZoom = option.dataZoom as Array<{ startValue?: number, endValue?: number }>

    expect(dataZoom).toEqual([
      expect.objectContaining({ startValue: 7, endValue: 19 }),
      expect.objectContaining({ startValue: 7, endValue: 19 }),
    ])
  })
})

describe('buildCrossSectionOption donut tooltip formatter', () => {
  it('populates a single entry using the hovered donut slice', () => {
    const chartData: KChartData = {
      datasets: [
        {
          label: '200',
          rawDimension: '200',
          backgroundColor: '#7e57c2',
          borderColor: '#7e57c2',
          data: [25],
          total: 25,
        },
      ],
    }
    const { formatter, tooltipState } = createDonutFormatter(chartData)

    formatter({
      name: '200',
      value: 25,
      color: '#7e57c2',
    })

    expect(tooltipState.title).toBe('Tooltip title')
    expect(tooltipState.subtitle).toBe('Status code')
    expect(tooltipState.metricDisplay).toBe('Request count')
    expect(tooltipState.entries).toEqual([
      expect.objectContaining({
        label: '200',
        value: '25 requests',
        rawValue: 25,
        backgroundColor: '#7e57c2',
        borderColor: '#7e57c2',
      }),
    ])
  })
})

describe('buildTimeseriesOption tooltip formatter', () => {
  it('populates sorted tooltip entries and a formatted timestamp subtitle', () => {
    const chartData: KChartData = {
      datasets: [
        {
          label: '500',
          backgroundColor: '#ef5350',
          borderColor: '#ef5350',
          data: [
            { x: Date.UTC(2024, 0, 1, 0, 0), y: 10 },
            { x: Date.UTC(2024, 0, 1, 1, 0), y: 20 },
          ],
        },
        {
          label: '200',
          backgroundColor: '#42a5f5',
          borderColor: '#42a5f5',
          data: [
            { x: Date.UTC(2024, 0, 1, 0, 0), y: 30 },
            { x: Date.UTC(2024, 0, 1, 1, 0), y: 40 },
          ],
        },
      ],
    }
    const { formatter, tooltipState } = createTimeseriesFormatter(chartData)
    const timestamp = Date.UTC(2024, 0, 1, 1, 0)
    const expectedSubtitle = formatTooltipTimestampByGranularity({
      tickValue: new Date(timestamp),
      granularity: 'hourly',
    })

    formatter([
      {
        seriesName: '500',
        value: [timestamp, 20],
        color: '#ef5350',
        borderColor: '#ef5350',
        axisValue: timestamp,
      },
      {
        seriesName: '200',
        value: [timestamp, 40],
        color: '#42a5f5',
        borderColor: '#42a5f5',
        axisValue: timestamp,
      },
    ])

    expect(tooltipState.title).toBe('Tooltip title')
    expect(tooltipState.metricDisplay).toBe('Request count')
    expect(tooltipState.subtitle).toBe(expectedSubtitle)
    expect(tooltipState.entries).toEqual([
      expect.objectContaining({
        label: '200',
        value: '40 requests',
        rawValue: 40,
      }),
      expect.objectContaining({
        label: '500',
        value: '20 requests',
        rawValue: 20,
      }),
    ])
  })
})
