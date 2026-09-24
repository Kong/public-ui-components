import { describe, it, expect } from 'vitest'
import useLineChartOptions from './useLineChartOptions'
import { ref, computed, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { LineChartOptions } from '../types'

const mockTooltipState = {
  showTooltip: false,
  tooltipContext: 0,
  tooltipSeries: [],
  left: 'foo',
  top: 'bar',
  units: 'count',
  translateUnit: (unit: string, value: number) => '',
  offsetX: 0,
  offsetY: 0,
  width: 0,
  height: 0,
  chartType: 'timeseries_line' as const,
}

describe('useLineChartOptions', () => {

  it('has no radius without hover when pointsWithoutHover is false', () => {
    let result: ReturnType<typeof useLineChartOptions>

    // eslint-disable-next-line vue/one-component-per-file
    mount(defineComponent({
      setup() {
        result = useLineChartOptions({
          tooltipState: mockTooltipState,
          legendID: 'foo',
          stacked: ref(false),
          timeRangeMs: ref(1000),
          granularity: ref('secondly'),
          pointsWithoutHover: computed(() => false),
        })
        return () => h('div')
      },
    }))

    expect(result!.options.value.elements.point.radius).toBe(0)
  })

  it('has a radius without hover when pointsWithoutHover is true', () => {
    let result: ReturnType<typeof useLineChartOptions>

    // eslint-disable-next-line vue/one-component-per-file
    mount(defineComponent({
      setup() {
        result = useLineChartOptions({
          tooltipState: mockTooltipState,
          legendID: 'foo',
          stacked: ref(false),
          timeRangeMs: ref(1000),
          granularity: ref('secondly'),
          pointsWithoutHover: computed(() => true),
        })
        return () => h('div')
      },
    }))

    expect(result!.options.value.elements.point.radius).toBe(3)
  })

  describe('y axes', () => {
    const mountOptions = (extra: Partial<LineChartOptions> = {}) => {
      let result: ReturnType<typeof useLineChartOptions>

      // eslint-disable-next-line vue/one-component-per-file
      mount(defineComponent({
        setup() {
          result = useLineChartOptions({
            tooltipState: mockTooltipState,
            legendID: 'foo',
            stacked: ref(false),
            timeRangeMs: ref(1000),
            granularity: ref('secondly'),
            ...extra,
          })
          return () => h('div')
        },
      }))

      return result!.options.value
    }

    it('keeps a single y axis by default', () => {
      const options = mountOptions()

      expect(Object.keys(options.scales)).toEqual(['x', 'y'])
      expect(options.scales.y).not.toHaveProperty('display')
      expect(options.scales.y.grid).toEqual({ drawBorder: false })
    })

    it('hides the left grid when requested', () => {
      const options = mountOptions({ leftYAxisGrid: ref(false) })

      expect(options.scales.y.grid).toEqual({ drawBorder: false, drawOnChartArea: false })
    })

    it('adds a right axis with its grid hidden by default', () => {
      const options = mountOptions({ rightYAxis: ref({ title: 'Latency (ms)' }) })
      const scales = options.scales as Record<string, any>

      expect(scales.y.display).toBe('auto')
      expect(scales.y1).toMatchObject({
        display: 'auto',
        position: 'right',
        title: { display: true, text: 'Latency (ms)' },
        grid: { drawOnChartArea: false },
      })
    })

    it('shows the right grid when requested', () => {
      const options = mountOptions({ rightYAxis: ref({ showGrid: true }) })
      const scales = options.scales as Record<string, any>

      expect(scales.y1.grid.drawOnChartArea).toBe(true)
      expect(scales.y1.title.display).toBe(false)
    })
  })
})
