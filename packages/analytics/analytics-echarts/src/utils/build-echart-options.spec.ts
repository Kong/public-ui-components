import { describe, expect, it } from 'vitest'
import type { TooltipState, KChartData } from '../types'
import { buildCrossSectionOption, buildTimeseriesOption } from './build-echart-options'

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
      nameLocation: string
      nameRotate: number
      nameGap: number
    }
    const xAxis = option.xAxis as { name: string }
    const grid = option.grid as { left: number, bottom: number }
    const media = option.media as Array<{
      query: { maxWidth?: number, maxHeight?: number }
      option: {
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
    expect(xAxis.name).toBe('Request count')
    expect(yAxis.axisLabel.width).toBe(112)
    expect(yAxis.axisLabel.overflow).toBe('truncate')
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
          xAxis: expect.objectContaining({ splitNumber: 4 }),
          yAxis: { show: false },
        }),
      }),
      expect.objectContaining({
        query: { maxWidth: 400 },
        option: expect.objectContaining({
          xAxis: { show: false },
          yAxis: { show: false },
        }),
      }),
    ])
    expect(series[0].labelLayout({ rect: { width: 40 }, dataIndex: 0 })).toEqual({ hide: true })
    expect(series[0].labelLayout({ rect: { width: 120 }, dataIndex: 0 })).toEqual({ hide: false })
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
    expect(xAxis.axisLabel.width).toBe(96)
    expect(xAxis.axisLabel.overflow).toBe('truncate')
    expect(xAxis.nameGap).toBe(36)
    expect(yAxis.nameGap).toBe(76)
    expect(xAxis.axisLabel.formatter('A very long route label that should be truncated')).toBe('A very long route la...')
    expect(series[0].labelLayout({ rect: { height: 60, width: 48 }, dataIndex: 0 })).toEqual({ hide: true })
    expect(series[0].labelLayout({ rect: { height: 120, width: 96 }, dataIndex: 0 })).toEqual({ hide: false })
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
})
