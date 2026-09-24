import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HeatmapChart from './HeatmapChart.vue'
import ECharts from '../ECharts.vue'
import {
  KUI_COLOR_BACKGROUND,
  KUI_COLOR_BACKGROUND_INFO_STRONG,
  KUI_COLOR_BACKGROUND_INFO_WEAKEST,
} from '@kong/design-tokens'

const mountChart = (props: Record<string, unknown> = {}) => mount(HeatmapChart, {
  props,
  global: { stubs: { ECharts: true } },
})

const chart = (wrapper: ReturnType<typeof mountChart>) => wrapper.getComponent(ECharts)

const chartOption = (wrapper: ReturnType<typeof mountChart>) => chart(wrapper).props('option') as any

const data: Array<[number, number, number]> = [
  [0, 0, 100],
  [1, 2, 900],
]

describe('<HeatmapChart />', () => {
  it('builds the option from data props', () => {
    const wrapper = mountChart({
      data,
      xAxisLabels: ['May', ''],
      yAxisLabels: ['Mon', 'Tue'],
      seriesName: 'Token usage',
    })
    const option = chartOption(wrapper)

    expect(option.tooltip.position).toBe('top')
    expect(option.tooltip.formatter).toBeUndefined()
    expect(option.grid).toMatchObject({ outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' })
    expect(option.grid.left).toBe(10)
    expect(option.grid).not.toHaveProperty('height')
    expect(option.xAxis).toMatchObject({ type: 'category', data: ['May', ''] })
    expect(option.xAxis.axisLabel).toBeUndefined()
    expect(option.yAxis).toMatchObject({ type: 'category', data: ['Mon', 'Tue'], inverse: true, axisLabel: { overflow: 'truncate' } })
    expect(option.series[0].label.show).toBe(false)
    expect(option.series[0]).toMatchObject({ type: 'heatmap', name: 'Token usage', data })
    expect(option.series[0].itemStyle.borderColor).toBe(KUI_COLOR_BACKGROUND)
  })

  it('derives the visual map bounds from the data by default', () => {
    const wrapper = mountChart({ data, xAxisLabels: [], yAxisLabels: [] })
    const option = chartOption(wrapper)

    expect(option.visualMap).toMatchObject({
      min: 0,
      max: 900,
      inRange: { color: [KUI_COLOR_BACKGROUND_INFO_WEAKEST, KUI_COLOR_BACKGROUND_INFO_STRONG] },
    })
  })

  it('supports explicit bounds, color range and tooltip formatter', () => {
    const tooltipFormatter = () => 'formatted'
    const wrapper = mountChart({
      data,
      xAxisLabels: [],
      yAxisLabels: [],
      min: 5,
      max: 1000,
      colorRange: ['#111111', '#222222'],
      tooltipFormatter,
    })
    const option = chartOption(wrapper)

    expect(option.visualMap).toMatchObject({ min: 5, max: 1000, inRange: { color: ['#111111', '#222222'] } })
    expect(option.tooltip).toEqual({ position: 'top', formatter: tooltipFormatter })
  })

  it('uses valueFormatter for the tooltip value and the visual map labels', () => {
    const valueFormatter = (value: number) => `${value}%`
    const wrapper = mountChart({ data, xAxisLabels: [], yAxisLabels: [], valueFormatter })
    const option = chartOption(wrapper)

    expect(option.tooltip.valueFormatter(42)).toBe('42%')
    expect(option.visualMap.formatter(42)).toBe('42%')
  })

  it('has no zoom controls by default', () => {
    const option = chartOption(mountChart({ data, xAxisLabels: [], yAxisLabels: [] }))

    expect(option).not.toHaveProperty('dataZoom')
    expect(option.grid).toMatchObject({ right: 20, bottom: 70 })
  })

  it('supports more than two gradient colors', () => {
    const option = chartOption(mountChart({ data, xAxisLabels: [], yAxisLabels: [], colorRange: ['#111', '#222', '#333'] }))

    expect(option.visualMap.inRange.color).toEqual(['#111', '#222', '#333'])
  })

  it('shows formatted values in the cells with showValues', () => {
    const option = chartOption(mountChart({
      data,
      xAxisLabels: [],
      yAxisLabels: [],
      showValues: true,
      valueFormatter: (value: number) => `${value.toFixed(1)}%`,
    }))

    expect(option.series[0].label.show).toBe(true)
    expect(option.series[0].label.formatter({ value: [0, 0, 12.34] })).toBe('12.3%')
  })

  it('adds a locked scrollbar window when there are more rows than visibleRows', () => {
    const yAxisLabels = ['a', 'b', 'c', 'd', 'e']
    const option = chartOption(mountChart({ data, xAxisLabels: [], yAxisLabels, visibleRows: 3 }))

    expect(option.dataZoom).toEqual([
      expect.objectContaining({ type: 'slider', yAxisIndex: 0, zoomLock: true, startValue: 0, endValue: 2, width: 8 }),
    ])
    expect(option.grid.right).toBe(30)
  })

  it('skips the scrollbar when all rows fit in visibleRows', () => {
    const option = chartOption(mountChart({ data, xAxisLabels: [], yAxisLabels: ['a', 'b'], visibleRows: 3 }))

    expect(option).not.toHaveProperty('dataZoom')
  })

  it('always merges the option over the generated option, even without data', () => {
    const wrapper = mountChart({ option: { grid: { top: 30 } } })
    const option = chartOption(wrapper)

    expect(option.xAxis).toMatchObject({ type: 'category', data: [] })
    expect(option.grid).toMatchObject({ top: 30, outerBoundsMode: 'same' })
    expect(option.series[0]).toMatchObject({ type: 'heatmap', data: [] })
  })

  it('deep-merges the option over the generated option when both are provided', () => {
    const wrapper = mountChart({
      data,
      xAxisLabels: ['May'],
      yAxisLabels: ['Mon'],
      option: { visualMap: { max: 500 } },
    })
    const option = chartOption(wrapper)

    expect(option.visualMap).toMatchObject({ min: 0, max: 500 })
    expect(option.series[0]).toMatchObject({ type: 'heatmap', data })
  })

  it('deep-merges seriesOption into the generated series, keeping its data', () => {
    const wrapper = mountChart({
      data,
      xAxisLabels: ['May'],
      yAxisLabels: ['Mon'],
      seriesOption: { itemStyle: { borderRadius: 0 } },
    })
    const option = chartOption(wrapper)

    expect(option.series[0]).toMatchObject({ type: 'heatmap', data, itemStyle: { borderRadius: 0, borderWidth: 2 } })
  })

  it('replaces the generated series when option.series is provided', () => {
    const series = [{ type: 'heatmap', data: [[0, 0, 1]] }]
    const option = chartOption(mountChart({ data, xAxisLabels: [], yAxisLabels: [], option: { series } }))

    expect(option.series).toEqual(series)
  })
})
