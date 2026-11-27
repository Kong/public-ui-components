import type { Dataset, KChartData } from '../types'

import { describe, expect, it } from 'vitest'
import { toSparseBarData } from './stackedBarUtil'

const dataset = (label: string, data: Array<number | null>, extra: Partial<Dataset> = {}) =>
  ({ label, data, rawDimension: label, ...extra }) as Dataset

// Group-by only: one dataset per entity, with a value only in its own label's slot
const groupBy: KChartData = {
  labels: ['svc-a', 'svc-b', 'svc-c'],
  datasets: [
    dataset('svc-a', [300, null, null]),
    dataset('svc-b', [null, 200, null]),
    dataset('svc-c', [null, null, 100]),
  ],
}

describe('toSparseBarData', () => {
  it('keeps only the bars that exist, indexed by label position', () => {
    const result = toSparseBarData(groupBy, 'y')

    expect(result.datasets.map(ds => ds.data)).toEqual([
      [{ y: 0, x: 300 }],
      [{ y: 1, x: 200 }],
      [{ y: 2, x: 100 }],
    ])
  })

  it('puts the label index on x for vertical bars', () => {
    const result = toSparseBarData(groupBy, 'x')

    expect(result.datasets[1].data).toEqual([{ x: 1, y: 200 }])
  })

  it('keeps every present value for then-by segments', () => {
    const thenBy: KChartData = {
      labels: ['svc-a', 'svc-b', 'svc-c'],
      datasets: [dataset('route-1', [10, null, 30])],
    }

    expect(toSparseBarData(thenBy, 'y').datasets[0].data).toEqual([
      { y: 0, x: 10 },
      { y: 2, x: 30 },
    ])
  })

  it('drops zeros, which draw nothing', () => {
    const data: KChartData = { labels: ['a', 'b'], datasets: [dataset('m', [0, 5])] }

    expect(toSparseBarData(data, 'y').datasets[0].data).toEqual([{ y: 1, x: 5 }])
  })

  it('keeps entities with duplicate display names on separate rows', () => {
    const data: KChartData = {
      labels: ['dup', 'dup'],
      datasets: [dataset('dup', [1, null]), dataset('dup', [null, 2])],
    }

    expect(toSparseBarData(data, 'y').datasets.map(ds => ds.data)).toEqual([
      [{ y: 0, x: 1 }],
      [{ y: 1, x: 2 }],
    ])
  })

  it('keeps chart-level and dataset-level properties', () => {
    const data: KChartData = {
      labels: ['empty'],
      isLabelEmpty: [true],
      isMultiDimension: false,
      datasets: [dataset('empty', [7], { backgroundColor: '#123456', isSegmentEmpty: true })],
    }

    const result = toSparseBarData(data, 'y')

    expect(result).toMatchObject({
      labels: ['empty'],
      isLabelEmpty: [true],
      isMultiDimension: false,
    })
    expect(result.datasets[0]).toMatchObject({
      label: 'empty',
      backgroundColor: '#123456',
      isSegmentEmpty: true,
      rawDimension: 'empty',
    })
  })

  it('does not modify the dense input', () => {
    toSparseBarData(groupBy, 'y')

    expect(groupBy.datasets[0].data).toEqual([300, null, null])
  })
})
