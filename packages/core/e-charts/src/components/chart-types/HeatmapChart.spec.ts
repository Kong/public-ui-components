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

    expect(option.tooltip).toEqual({ position: 'top' })
    expect(option.xAxis).toMatchObject({ type: 'category', data: ['May', ''] })
    expect(option.yAxis).toMatchObject({ type: 'category', data: ['Mon', 'Tue'] })
    expect(option.series[0]).toMatchObject({ type: 'heatmap', name: 'Token usage', data })
    expect(option.series[0].itemStyle.borderColor).toBe(KUI_COLOR_BACKGROUND)
  })

  it('derives the visual map max from the data by default', () => {
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

  it('passes the raw option through untouched when no data is provided', () => {
    const option = { series: [{ type: 'heatmap', data: [] }] }
    const wrapper = mountChart({ option })

    expect(chart(wrapper).props('option')).toStrictEqual(option)
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
})
