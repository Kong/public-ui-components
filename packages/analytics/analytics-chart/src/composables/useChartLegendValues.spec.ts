import type { KChartData } from '../types'
import { ChartTypes } from '../enums'
import { computed } from 'vue'
import useChartLegendValues from './useChartLegendValues'
import { describe, it, expect } from 'vitest'

const lineChartData = computed<KChartData>(() => {
  return {
    datasets: [
      {
        rawMetric: 'test1',
        rawDimension: 'test1',
        label: 'test1',
        data: [
          {
            x: 1677744000000,
            y: 10,
          },
          {
            x: 1677830400000,
            y: 10,
          },
          {
            x: 1677916800000,
            y: 10,
          },
          {
            x: 1678003200000,
            y: 10,
          },
          {
            x: 1678089600000,
            y: 10,
          },
          {
            x: 1678176000000,
            y: 10,
          },
          {
            x: 1678262400000,
            y: 10,
          },
        ],
      },
      {
        rawMetric: 'test2',
        rawDimension: 'test2',
        label: 'test2',
        data: [
          {
            x: 1677744000000,
            y: 10,
          },
          {
            x: 1677830400000,
            y: 10,
          },
          {
            x: 1677916800000,
            y: 10,
          },
          {
            x: 1678003200000,
            y: 10,
          },
          {
            x: 1678089600000,
            y: 10,
          },
          {
            x: 1678176000000,
            y: 10,
          },
          {
            x: 1678262400000,
            y: 10,
          },
        ],
      },
    ],
  }
})

const lineChartDataWithTotal = computed<KChartData>(() => {
  return {
    datasets: [
      {
        rawDimension: 'test1',
        rawMetric: 'test1',
        label: 'test1',
        data: [],
        total: 100,
      },
      {
        rawDimension: 'test2',
        rawMetric: 'test2',
        label: 'test2',
        data: [],
        total: 100,
      },
    ],
  }
})

const barChartData = computed<KChartData>(() => {
  return {
    labels: [
      'test1',
      'test2',
    ],
    datasets: [
      {
        rawDimension: 'test1',
        rawMetric: 'test1',
        label: 'test1',
        data: [
          10,
          0,
        ],
      },
      {
        rawDimension: 'test2',
        rawMetric: 'test2',
        label: 'test2',
        data: [
          0,
          20,
        ],
      },
    ],
  }
})

describe('useChartLegendValues', () => {

  it('correctly computes legend values for a line chart by adding up individual datapoints', () => {
    const { legendValues } = useChartLegendValues(lineChartData, ChartTypes.TIMESERIES_LINE, computed(() => 'apples'))

    expect(legendValues.value).toEqual({
      test1: { raw: 70, formatted: '70 apples' },
      test2: { raw: 70, formatted: '70 apples' },
    })
  })

  it('correctly computes legend values for a line chart using total property available on the dataset', () => {
    const { legendValues } = useChartLegendValues(lineChartDataWithTotal, ChartTypes.TIMESERIES_LINE, computed(() => 'apples'))

    expect(legendValues.value).toEqual({
      test1: { raw: 100, formatted: '100 apples' },
      test2: { raw: 100, formatted: '100 apples' },
    })
  })

  it('correctly computes legend values for a bar chart', () => {
    const { legendValues } = useChartLegendValues(barChartData, ChartTypes.VERTICAL_BAR, computed(() => 'apples'))

    expect(legendValues.value).toEqual({
      test1: { raw: 10, formatted: '10 apples' },
      test2: { raw: 20, formatted: '20 apples' },
    })
  })

})
