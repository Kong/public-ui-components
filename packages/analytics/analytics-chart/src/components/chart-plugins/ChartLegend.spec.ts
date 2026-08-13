import type { EnhancedLegendItem } from 'src/types'

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

import ChartLegend from './ChartLegend.vue'
import { ChartLegendPosition } from '../../enums'

const legendItem = (overrides: Partial<EnhancedLegendItem> = {}): EnhancedLegendItem => ({
  text: 'Dataset A',
  datasetIndex: 0,
  index: 0,
  fillStyle: '#000',
  strokeStyle: '#000',
  value: { raw: 0, formatted: '' },
  ...overrides,
})

const createChart = (overrides: {
  isDatasetVisible?: (i: number) => boolean
  getDataVisibility?: (i: number) => boolean
  datasetMeta?: { dataset?: object, data?: any[] }
} = {}) => ({
  isDatasetVisible: overrides.isDatasetVisible ?? (() => true),
  getDataVisibility: overrides.getDataVisibility ?? (() => true),
  getDatasetMeta: () => ({
    dataset: overrides.datasetMeta?.dataset,
    data: overrides.datasetMeta?.data ?? [],
  }),
  hide: vi.fn(),
  show: vi.fn(),
  toggleDataVisibility: vi.fn(),
  update: vi.fn(),
})

const createDonutChart = (overrides: Parameters<typeof createChart>[0] = {}) =>
  createChart({ datasetMeta: { dataset: undefined, data: [{}] }, ...overrides })

const createLineChart = (overrides: Parameters<typeof createChart>[0] = {}) =>
  createChart({ datasetMeta: { dataset: {}, data: [{}] }, ...overrides })

const wrapChart = (chart: any) => chart === null ? null : { chart }

const mountLegend = (items: EnhancedLegendItem[], chartInstance: any, { wrap = true } = {}) => {
  return mount(ChartLegend, {
    props: {
      id: 'test-legend',
      items,
      chartInstance: (wrap ? wrapChart(chartInstance) : chartInstance) as Record<string, any>,
    },
    global: {
      provide: {
        legendPosition: ref(ChartLegendPosition.Bottom),
        showLegendValues: false,
      },
      stubs: {
        KTooltip: { template: '<div><slot /><slot name="content" /></div>' },
      },
    },
  })
}

describe('ChartLegend', () => {
  describe('isDatasetVisible', () => {
    it('returns true when chartInstance is null', () => {
      const wrapper = mountLegend([legendItem()], null)
      expect(wrapper.find('.strike-through').exists()).toBe(false)
    })

    it('returns true when chartInstance.chart is null', () => {
      const wrapper = mountLegend([legendItem()], { chart: null }, { wrap: false })
      expect(wrapper.find('.strike-through').exists()).toBe(false)
    })

    it('delegates to isDatasetVisible for line charts', () => {
      const chart = createChart({
        isDatasetVisible: () => false,
        datasetMeta: { dataset: {}, data: [] },
      })
      const wrapper = mountLegend([legendItem()], chart)
      expect(wrapper.find('.strike-through').exists()).toBe(true)
    })

    it('delegates to isDatasetVisible when segmentIndex is undefined', () => {
      const chart = createChart({
        isDatasetVisible: () => false,
        datasetMeta: { dataset: undefined, data: [] },
      })
      const wrapper = mountLegend([legendItem({ index: undefined })], chart)
      expect(wrapper.find('.strike-through').exists()).toBe(true)
    })

    it('delegates to getDataVisibility for visible doughnut segments', () => {
      const chart = createChart({
        getDataVisibility: () => true,
        datasetMeta: { dataset: undefined, data: [{}] },
      })
      const wrapper = mountLegend([legendItem({ index: 0 })], chart)
      expect(wrapper.find('.strike-through').exists()).toBe(false)
    })

    it('delegates to getDataVisibility for hidden doughnut segments', () => {
      const chart = createChart({
        getDataVisibility: () => false,
        datasetMeta: { dataset: undefined, data: [{}] },
      })
      const wrapper = mountLegend([legendItem({ index: 0 })], chart)
      expect(wrapper.find('.strike-through').exists()).toBe(true)
    })

    it('delegates to getDataVisibility instead of indexing datasetMeta.data when segmentIndex is out of bounds', () => {
      const calledWith: number[] = []
      const chart = createChart({
        getDataVisibility: (i: number) => {
          calledWith.push(i)

          return true
        },
        datasetMeta: { dataset: undefined, data: [{}] },
      })

      expect(() => mountLegend([legendItem({ index: 5 })], chart)).not.toThrow()
      expect(calledWith).toEqual([5])
    })
  })

  describe('handleLegendItemClick', () => {
    it('toggles visibility for donut charts', async () => {
      const chart = createDonutChart()
      const wrapper = mountLegend([legendItem({ index: 0 })], chart)

      await wrapper.get('li').trigger('click')

      expect(chart.toggleDataVisibility).toHaveBeenCalledWith(0)
      expect(chart.hide).not.toHaveBeenCalled()
      expect(chart.show).not.toHaveBeenCalled()
      expect(chart.update).toHaveBeenCalledOnce()
    })

    it('toggles hidden donut segments back on', async () => {
      const chart = createDonutChart({ getDataVisibility: () => false })
      const wrapper = mountLegend([legendItem({ index: 0 })], chart)

      await wrapper.get('li').trigger('click')

      expect(chart.toggleDataVisibility).toHaveBeenCalledWith(0)
      expect(chart.show).not.toHaveBeenCalled()
    })

    it('toggles only the clicked donut segment', async () => {
      const chart = createDonutChart({ datasetMeta: { dataset: undefined, data: [{}, {}, {}] } })
      const items = [
        legendItem({ text: 'A', index: 0 }),
        legendItem({ text: 'B', index: 1 }),
        legendItem({ text: 'C', index: 2 }),
      ]
      const wrapper = mountLegend(items, chart)

      await wrapper.findAll('li')[2].trigger('click')

      expect(chart.toggleDataVisibility).toHaveBeenCalledOnce()
      expect(chart.toggleDataVisibility).toHaveBeenCalledWith(2)
    })

    it('hides visible datasets for line and bar charts', async () => {
      const chart = createLineChart({ isDatasetVisible: () => true })
      const wrapper = mountLegend([legendItem({ datasetIndex: 1, index: 0 })], chart)

      await wrapper.get('li').trigger('click')

      expect(chart.hide).toHaveBeenCalledWith(1, 0)
      expect(chart.toggleDataVisibility).not.toHaveBeenCalled()
      expect(chart.update).toHaveBeenCalledOnce()
    })

    it('shows hidden datasets for line and bar charts', async () => {
      const chart = createLineChart({ isDatasetVisible: () => false })
      const wrapper = mountLegend([legendItem({ datasetIndex: 1, index: 0 })], chart)

      await wrapper.get('li').trigger('click')

      expect(chart.show).toHaveBeenCalledWith(1, 0)
      expect(chart.toggleDataVisibility).not.toHaveBeenCalled()
    })

    it('falls back to hide/show when the item has no segment index', async () => {
      const chart = createChart({ datasetMeta: { dataset: undefined, data: [] } })
      const wrapper = mountLegend([legendItem({ index: undefined })], chart)

      await wrapper.get('li').trigger('click')

      expect(chart.toggleDataVisibility).not.toHaveBeenCalled()
      expect(chart.hide).toHaveBeenCalledWith(0, undefined)
    })

    it('defaults datasetIndex to 0 when the item has none', async () => {
      const chart = createDonutChart()
      const wrapper = mountLegend([legendItem({ datasetIndex: undefined, index: 0 })], chart)

      await wrapper.get('li').trigger('click')

      expect(chart.toggleDataVisibility).toHaveBeenCalledWith(0)
    })

    it('does nothing when chartInstance is null', async () => {
      const wrapper = mountLegend([legendItem()], null)

      await expect(wrapper.get('li').trigger('click')).resolves.not.toThrow()
    })
  })
})
