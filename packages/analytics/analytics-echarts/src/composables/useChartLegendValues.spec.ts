import { ref } from 'vue'
import { describe, expect, it } from 'vitest'
import useChartLegendValues from './useChartLegendValues'

describe('useChartLegendValues', () => {
  it('formats compact legend values with translated units', () => {
    const chartData = ref({
      datasets: [{
        label: 'Request count',
        rawDimension: 'Request count',
        data: [{ x: 1, y: 1250 }],
        total: 1250,
      }],
    })

    const { legendValues } = useChartLegendValues(chartData as any, ref('count'))

    expect(legendValues.value['Request count']?.raw).toBe(1250)
    expect(legendValues.value['Request count']?.formatted).toContain('requests')
  })
})
