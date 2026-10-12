import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { init, use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import TreeMapChart from './TreeMapChart.vue'
import ECharts from '../ECharts.vue'
import type { EChartsOption } from 'echarts'
import type { EChartsType } from 'echarts/core'
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

// For the zoom specs, which run the option through a real ECharts instance
use([SVGRenderer])

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
    expect(option.series[0]).toMatchObject({ type: 'treemap', name: 'Usage', data })
  })

  it('defaults to the token color palette on the root level only', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0]).not.toHaveProperty('color')
    expect(option.series[0].levels[0].color).toEqual([
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

    expect(option.series[0].levels[0].color).toEqual(['#111111', '#222222'])
  })

  it('passes colors set on nodes in data through untouched', () => {
    const colored: TreeMapDataNode[] = [
      { name: 'openai', itemStyle: { color: '#a86cd5' }, children: [{ name: 'gpt-4o', value: 1200 }] },
    ]
    const option = chartOption(mountChart({ data: colored }))

    expect(option.series[0].data).toEqual(colored)
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

  it('styles levels: bordered groups, children fading by value', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0].levels[0]).toMatchObject({
      itemStyle: { borderColor: KUI_COLOR_BACKGROUND, borderWidth: 2, gapWidth: 2 },
    })
    expect(option.series[0].levels[0]).not.toHaveProperty('upperLabel')
    expect(option.series[0].levels[1]).toMatchObject({
      colorAlpha: [0.55, 1],
      itemStyle: { borderColor: KUI_COLOR_BACKGROUND, borderWidth: 1, gapWidth: 1 },
    })
  })

  it('drills down with a breadcrumb and roams by default', () => {
    const option = chartOption(mountChart({ data }))

    expect(option.series[0]).toMatchObject({ nodeClick: 'zoomToNode', roam: true, left: 0, top: 0, right: 0, bottom: 40, visibleMin: 0 })
    expect(option.series[0].breadcrumb.show).toBe(true)
    // The full depth, so every level shows and the breadcrumb follows the view root
    expect(option.series[0].leafDepth).toBe(2)
  })

  describe('zooming into a node', () => {
    // A long tail of 100 users, down to `user99`, which starts too small to draw at all
    const longTail: TreeMapDataNode[] = [
      {
        name: 'claude',
        children: Array.from({ length: 100 }, (_, i) => ({ name: `user${i}`, value: Math.round(1e6 / (i + 1) ** 3) })),
      },
      { name: 'gpt', children: [{ name: 'other', value: 500_000 }] },
    ]

    // Room for the breadcrumb is left below the 600x400 treemap area
    const CHART_AREA = 600 * 400

    /** Runs the option through a real ECharts instance, server-side so no canvas is needed */
    const renderChart = (option: EChartsOption) => {
      const instance = init(null, null, { renderer: 'svg', ssr: true, width: 600, height: 440 })

      instance.setOption(option)

      return instance
    }

    /** The node's laid out rect, in chart pixels */
    const nodeRect = (instance: EChartsType, name: string) => {
      const { tree } = (instance as any).getModel().getSeriesByIndex(0).getData()
      let rect

      tree.root.eachNode((node: any) => {
        if (node.name === name) {
          rect = node.getLayout()
        }
      })

      return rect as unknown as { width: number, height: number }
    }

    const zoomTo = (instance: EChartsType, name: string) => {
      instance.dispatchAction({ type: 'treemapZoomToNode', targetNodeId: name })
    }

    it('zooms the smallest node until it fills about a fifth of the chart', () => {
      const instance = renderChart(chartOption(mountChart({ data: longTail })))

      expect(nodeRect(instance, 'user99').width).toBeLessThan(1)

      zoomTo(instance, 'user99')

      const { width, height } = nodeRect(instance, 'user99')

      expect(width * height / CHART_AREA).toBeCloseTo(0.2, 1)
      // Roughly square, so its label has room
      expect(Math.min(width, height)).toBeGreaterThan(150)

      instance.dispose()
    })

    it('leaves the smallest node unreadable when seriesOption restores the ECharts 5x zoom ceiling', () => {
      const instance = renderChart(chartOption(mountChart({ data: longTail, seriesOption: { scaleLimit: { max: 5 } } })))

      zoomTo(instance, 'user99')

      expect(nodeRect(instance, 'user99').width).toBeLessThan(5)

      instance.dispose()
    })
  })

  it('defaults leafDepth to 1 for flat data', () => {
    const flat: TreeMapDataNode[] = [{ name: 'Gateways', value: 300 }, { name: 'Plugins', value: 100 }]

    expect(chartOption(mountChart({ data: flat })).series[0].leafDepth).toBe(1)
  })

  it('is a static chart filling the whole area with drillDown false', () => {
    const option = chartOption(mountChart({ data, drillDown: false }))

    expect(option.series[0]).toMatchObject({ nodeClick: false, roam: false, bottom: 0 })
    expect(option.series[0].breadcrumb.show).toBe(false)
  })

  it('passes leafDepth through to limit the initial depth', () => {
    expect(chartOption(mountChart({ data, leafDepth: 2 })).series[0].leafDepth).toBe(2)
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

  it('uses the default name label when showValues is false, even with valueFormatter', () => {
    const option = chartOption(mountChart({ data, showValues: false, valueFormatter: (value: number) => `${value}%` }))

    expect(option.series[0].label.formatter).toBeUndefined()
  })

  it('uses tooltipTitle as the tooltip title', () => {
    const wrapper = mountChart({ data, tooltipTitle: 'Resources' })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Gateways', value: 42 } as any)?.title).toBe('Resources')
  })

  it('maps the hovered node to the shared tooltip content', () => {
    const wrapper = mountChart({ data, seriesName: 'Usage' })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Gateways', value: 42, color: '#123456' } as any)).toEqual({
      metric: 'Usage',
      rows: [{ color: '#123456', label: 'Gateways', value: '42' }],
    })
  })

  it('shows the hovered node\'s parent groups as the tooltip context', () => {
    const wrapper = mountChart({ data, seriesName: 'Usage' })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent
    // `treePathInfo` runs from the root to the node itself
    const treePathInfo = [{ name: '' }, { name: 'Gateways' }, { name: 'us-east' }, { name: 'dp-1' }]

    expect(nodeTooltipContent({ name: 'dp-1', value: 7, treePathInfo } as any)).toMatchObject({
      context: 'Gateways / us-east',
      metric: 'Usage',
      rows: [{ label: 'dp-1', value: '7' }],
    })
  })

  it('shows no tooltip for the root, which is hovered through the gaps between groups', () => {
    const wrapper = mountChart({ data, seriesName: 'Usage' })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Usage', value: 100, treePathInfo: [{ name: 'Usage' }] } as any)).toBeUndefined()
  })

  it('uses valueFormatter for the tooltip value', () => {
    const wrapper = mountChart({ data, valueFormatter: (value: number) => `${value}%` })
    const nodeTooltipContent = chart(wrapper).props('tooltipContent') as ChartTooltipContent

    expect(nodeTooltipContent({ name: 'Gateways', value: 42 } as any)?.rows?.[0]?.value).toBe('42%')
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
