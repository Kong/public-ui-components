import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SankeyChart from './SankeyChart.vue'
import ECharts from '../ECharts.vue'
import type { ChartTooltipContent, SankeyLink, SankeyNode } from '../../types/index.ts'
import {
  KUI_COLOR_BACKGROUND_INFO_WEAK,
  KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
  KUI_COLOR_BACKGROUND_WARNING_WEAK,
  KUI_COLOR_BACKGROUND_DANGER_WEAK,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE,
  KUI_COLOR_BACKGROUND_INFO_STRONG,
  KUI_COLOR_BACKGROUND_SUCCESS,
} from '@kong/design-tokens'

const mountChart = (props: Record<string, unknown> = {}) => mount(SankeyChart, {
  props,
  global: { stubs: { ECharts: true } },
})

const chart = (wrapper: ReturnType<typeof mountChart>) => wrapper.getComponent(ECharts)

const chartOption = (wrapper: ReturnType<typeof mountChart>) => chart(wrapper).props('option') as any

const tooltipContent = (wrapper: ReturnType<typeof mountChart>) => chart(wrapper).props('tooltipContent') as ChartTooltipContent

const nodes: SankeyNode[] = [
  { id: 'model:gpt-5', name: 'gpt-5' },
  { id: 'model:claude', name: 'claude' },
  { id: 'consumer:alex', name: 'alex@example.com' },
]

const links: SankeyLink[] = [
  { source: 'model:gpt-5', target: 'consumer:alex', value: 300 },
  { source: 'model:claude', target: 'consumer:alex', value: 100 },
]

const nodeColors = (wrapper: ReturnType<typeof mountChart>) => chartOption(wrapper).series[0].data.map((node: SankeyNode) => node.itemStyle?.color)

describe('<SankeyChart />', () => {
  describe('node colors', () => {
    it('colors each node from the token palette, in order', () => {
      expect(nodeColors(mountChart({ nodes, links }))).toEqual([
        KUI_COLOR_BACKGROUND_INFO_WEAK,
        KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
        KUI_COLOR_BACKGROUND_WARNING_WEAK,
      ])
    })

    it('cycles the palette when there are more nodes than colors', () => {
      const many = Array.from({ length: 9 }, (_, index) => ({ id: `n${index}`, name: `n${index}` }))

      expect(nodeColors(mountChart({ nodes: many }))).toEqual([
        KUI_COLOR_BACKGROUND_INFO_WEAK,
        KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
        KUI_COLOR_BACKGROUND_WARNING_WEAK,
        KUI_COLOR_BACKGROUND_DANGER_WEAK,
        KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE,
        KUI_COLOR_BACKGROUND_INFO_STRONG,
        KUI_COLOR_BACKGROUND_SUCCESS,
        KUI_COLOR_BACKGROUND_INFO_WEAK,
        KUI_COLOR_BACKGROUND_SUCCESS_WEAK,
      ])
    })

    it('uses colorPalette instead of the token palette', () => {
      expect(nodeColors(mountChart({ nodes, colorPalette: ['#111111', '#222222'] }))).toEqual(['#111111', '#222222', '#111111'])
    })

    it('falls back to the token palette when colorPalette is empty', () => {
      expect(nodeColors(mountChart({ nodes, colorPalette: [] }))[0]).toBe(KUI_COLOR_BACKGROUND_INFO_WEAK)
    })

    it('keeps colors set on nodes, and their other item styles', () => {
      const colored: SankeyNode[] = [
        { id: 'a', name: 'a', itemStyle: { color: '#abcdef' } },
        { id: 'b', name: 'b', itemStyle: { opacity: 0.5 } },
      ]
      const [first, second] = chartOption(mountChart({ nodes: colored })).series[0].data

      expect(first).toEqual(colored[0])
      // Palette colors follow the node's index, colored nodes included
      expect(second.itemStyle).toEqual({ opacity: 0.5, color: KUI_COLOR_BACKGROUND_SUCCESS_WEAK })
    })
  })

  describe('node labels', () => {
    const label = (wrapper: ReturnType<typeof mountChart>, node: SankeyNode, value: number) => (
      chartOption(wrapper).series[0].label.formatter({ data: node, value })
    )

    it('shows the node name, not its id', () => {
      expect(label(mountChart({ nodes }), nodes[2], 400)).toBe('alex@example.com')
    })

    it('adds the formatted value with showValues', () => {
      const wrapper = mountChart({ nodes, showValues: true, valueFormatter: (value: number) => `${value} req` })

      expect(label(wrapper, nodes[2], 400)).toBe('alex@example.com: 400 req')
    })

    it('falls back to the raw value when showValues is set without valueFormatter', () => {
      expect(label(mountChart({ nodes, showValues: true }), nodes[2], 400)).toBe('alex@example.com: 400')
    })
  })

  describe('tooltip', () => {
    it('shows a link\'s source as the context and its target as the row, in the source color', () => {
      const wrapper = mountChart({ nodes, links, seriesName: 'Requests', tooltipTitle: 'Model usage' })

      expect(tooltipContent(wrapper)({ dataType: 'edge', data: links[0], value: 300 } as any)).toEqual({
        title: 'Model usage',
        context: 'gpt-5',
        metric: 'Requests',
        rows: [{ color: KUI_COLOR_BACKGROUND_INFO_WEAK, label: 'alex@example.com', value: '300' }],
      })
    })

    it('falls back to the node ids for links to unknown nodes', () => {
      const wrapper = mountChart({ nodes })
      const link = { source: 'model:missing', target: 'consumer:missing', value: 1 }

      expect(tooltipContent(wrapper)({ dataType: 'edge', data: link, value: 1 } as any)).toMatchObject({
        context: 'model:missing',
        rows: [{ color: undefined, label: 'consumer:missing' }],
      })
    })

    it('shows a node\'s name and total', () => {
      const wrapper = mountChart({ nodes, links, seriesName: 'Requests' })

      // ECharts passes the node's `id` as `name`
      expect(tooltipContent(wrapper)({ dataType: 'node', name: 'consumer:alex', data: nodes[2], value: 400, color: '#123456' } as any)).toEqual({
        metric: 'Requests',
        rows: [{ color: '#123456', label: 'alex@example.com', value: '400' }],
      })
    })

    it('uses valueFormatter for link and node values', () => {
      const wrapper = mountChart({ nodes, links, valueFormatter: (value: number) => `${value} req` })

      expect(tooltipContent(wrapper)({ dataType: 'edge', data: links[1], value: 100 } as any)?.rows?.[0]?.value).toBe('100 req')
      expect(tooltipContent(wrapper)({ dataType: 'node', data: nodes[0], value: 300 } as any)?.rows?.[0]?.value).toBe('300 req')
    })
  })

  it('always merges the option over the generated option, even without data', () => {
    const option = chartOption(mountChart({ option: { animation: false } }))

    expect(option.series[0]).toMatchObject({ type: 'sankey', data: [], links: [] })
    expect(option.animation).toBe(false)
  })

  it('deep-merges seriesOption into the generated series, keeping its nodes and links', () => {
    const option = chartOption(mountChart({ nodes, links, seriesOption: { nodeWidth: 20, label: { fontWeight: 'bold' } } }))

    expect(option.series[0]).toMatchObject({ type: 'sankey', links, nodeWidth: 20, label: { fontWeight: 'bold', overflow: 'truncate' } })
    expect(option.series[0].data.map(({ id }: SankeyNode) => id)).toEqual(nodes.map(({ id }) => id))
  })
})
