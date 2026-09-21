import { describe, it, expect } from 'vitest'
import useLineChartOptions from './useLineChartOptions'
import { ref, computed, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

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
})
