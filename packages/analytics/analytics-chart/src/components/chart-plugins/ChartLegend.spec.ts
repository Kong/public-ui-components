import type { EnhancedLegendItem } from 'src/types'

import { describe, it, expect } from 'vitest'
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
})

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
})
