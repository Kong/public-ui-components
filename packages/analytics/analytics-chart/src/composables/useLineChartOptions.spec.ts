import { describe, it, expect } from 'vitest'
import useLinechartOptions from './useLineChartOptions'
import { ref } from 'vue'

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
  height:0,
  chartType: 'timeseries_line' as const,
}

describe('useLineChartOptions', () => {

  it('has no radius without hover when pointsWithoutHover is false', () => {
    const { options } = useLinechartOptions({
      tooltipState: mockTooltipState,
      legendID: 'foo',
      stacked: ref(false),
      timeRangeMs: ref(1000),
      granularity: ref('secondly'),
      pointsWithoutHover: false,
    })

    expect(options.value.elements.point.radius).toBe(0)
  })

  it('has a radius without hover when pointsWithoutHover is true', () => {
    const { options } = useLinechartOptions({
      tooltipState: mockTooltipState,
      legendID: 'foo',
      stacked: ref(false),
      timeRangeMs: ref(1000),
      granularity: ref('secondly'),
      pointsWithoutHover: true,
    })

    expect(options.value.elements.point.radius).toBe(2)
  })
})
