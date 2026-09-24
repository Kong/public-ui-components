import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TreeMapChart from './TreeMapChart.vue'
import ECharts from '../ECharts.vue'
import type { ChartTooltipContent, TreeMapDataNode } from '../../types/index.ts'
import {
  KUI_COLOR_BACKGROUND,
  KUI_COLOR_BACKGROUND_PRIMARY_WEAK,
  KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  KUI_COLOR_BACKGROUND_WARNING_WEAK,
  KUI_COLOR_BACKGROUND_DANGER_WEAK,
  KUI_COLOR_BACKGROUND_INFO_WEAK,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
  KUI_COLOR_BACKGROUND_NEUTRAL_WEAK,
  KUI_COLOR_BACKGROUND_NEUTRAL,
  KUI_COLOR_TEXT,
} from '@kong/design-tokens'

const mountChart = (props: Record<string, unknown> = {}) => mount(TreeMapChart, {
  props,
  global: { stubs: { ECharts: true } },
})

const chart = (wrapper: ReturnType<typeof mountChart>) => wrapper.getComponent(ECharts)

const chartOption = (wrapper: ReturnType<typeof mountChart>) => chart(wrapper).props('option') as any

const data: TreeMapDataNode[] = [
  {
    name: 'Gateways',
    children: [
      { name: 'us-east', value: 300 },
      { name: 'eu-west', value: 200 },
    ],
  },
  { name: 'Plugins', children: [{ name: 'rate-limiting', value: 100 }] },
]

describe('<TreeMapChart />', () => {
  it('builds the option from data props', () => {
    const wrapper = mountChart({ data, seriesName: 'Usage' })
    const option = chartOption(wrapper)

    expect(option.tooltip).toBeUndefined()
    expect(option.series[0]).toMatchObject({ type: 'treemap', name: 'Usage', data, nodeClick: 'zoomToNode' })
  })

  it('defaults to the token color palette', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0].color).toEqual([
      KUI_COLOR_BACKGROUND_PRIMARY_WEAK,
      KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
      KUI_COLOR_BACKGROUND_WARNING_WEAK,
      KUI_COLOR_BACKGROUND_DANGER_WEAK,
      KUI_COLOR_BACKGROUND_INFO_WEAK,
      KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
      KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
    ])
  })

  it('replaces the palette with colorPalette', () => {
    const option = chartOption(mountChart({ data, colorPalette: ['#111111', '#222222'] }))

    expect(option.series[0].color).toEqual(['#111111', '#222222'])
  })

  it('shows the breadcrumb with neutral item styles', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0].breadcrumb).toMatchObject({
      show: true,
      itemStyle: {
        color: KUI_COLOR_BACKGROUND_NEUTRAL_WEAK,
        borderColor: 'transparent',
        borderWidth: 0,
        textStyle: { color: KUI_COLOR_TEXT },
      },
      emphasis: {
        itemStyle: {
          color: KUI_COLOR_BACKGROUND_NEUTRAL,
          textStyle: { color: KUI_COLOR_TEXT },
        },
      },
    })
  })

  it('styles levels: bordered groups, saturated children', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0].levels[0]).toMatchObject({
      itemStyle: { borderColor: KUI_COLOR_BACKGROUND, borderWidth: 2, gapWidth: 2 },
    })
    expect(option.series[0].levels[0]).not.toHaveProperty('upperLabel')
    expect(option.series[0].levels[1]).toMatchObject({
      colorSaturation: [0.3, 0.5],
      itemStyle: { borderColor: KUI_COLOR_BACKGROUND, borderWidth: 1, gapWidth: 1 },
    })
  })

  it('fills the chart area without drill-down by default', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0]).not.toHaveProperty('leafDepth')
    expect(option.series[0]).toMatchObject({ left: 0, top: 0, right: 0, bottom: 0, visibleMin: 0 })
  })

  it('enables drill-down with leafDepth and reserves room for the breadcrumb', () => {
    const option = chartOption(mountChart({ data, leafDepth: 2 }))

    expect(option.series[0].leafDepth).toBe(2)
    expect(option.series[0].bottom).toBe(40)
  })

  it('shows node names by default without a label formatter', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0].label).toMatchObject({ show: true, align: 'center', verticalAlign: 'middle', overflow: 'truncate' })
    expect(option.series[0].label.formatter).toBeUndefined()
  })

  it('shows formatted values in the labels with showValues', () => {
    const option = chartOption(mountChart({
      data,
      showValues: true,
      valueFormatter: (value: number) => `${value}%`,
    }))

    expect(option.series[0].label.formatter({ name: 'n', value: 3 })).toBe('n\n3%')
  })

  it('falls back to the raw value when showValues is set without valueFormatter', () => {
    const option = chartOption(mountChart({ data, showValues: true }))

    expect(option.series[0].label.formatter({ name: 'n', value: 3 })).toBe('n\n3')
  })

  it('shows only the name when showValues is false', () => {
    const option = chartOption(mountChart({ data, showValues: false, valueFormatter: (value: number) => `${value}%` }))

    expect(option.series[0].label.formatter({ name: 'n', value: 3 })).toBe('n')
  })

  it('uses tooltipTitle as the tooltip title', () => {
    const wrapper = mountChart({ data, tooltipTitle: 'Resources' })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Gateways', value: 42 } as any).title).toBe('Resources')
  })

  it('maps the hovered node to the shared tooltip content', () => {
    const wrapper = mountChart({ data, seriesName: 'Usage' })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Gateways', value: 42, color: '#123456' } as any)).toEqual({
      rows: [{ color: '#123456', label: 'Gateways', value: '42' }],
    })
  })

  it('uses valueFormatter for the tooltip value', () => {
    const wrapper = mountChart({ data, valueFormatter: (value: number) => `${value}%` })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Gateways', value: 42 } as any).rows?.[0]?.value).toBe('42%')
  })

  it('always merges the option over the generated option, even without data', () => {
    const option = chartOption(mountChart({ option: { animation: false } }))

    expect(option.series[0]).toMatchObject({ type: 'treemap', data: [] })
    expect(option.animation).toBe(false)
  })

  it('replaces the generated series when option.series is provided', () => {
    const series = [{ type: 'treemap', data: [{ name: 'solo', value: 1 }] }]
    const option = chartOption(mountChart({ data, option: { series } }))

    expect(option.series).toEqual(series)
  })

  it('deep-merges seriesOption into the generated series, keeping its data', () => {
    const option = chartOption(mountChart({
      data,
      seriesOption: { itemStyle: { borderWidth: 4 }, label: { overflow: 'break' } },
    }))

    expect(option.series[0]).toMatchObject({
      type: 'treemap',
      data,
      itemStyle: { borderWidth: 4 },
      label: { overflow: 'break', show: true },
    })
  })
})
