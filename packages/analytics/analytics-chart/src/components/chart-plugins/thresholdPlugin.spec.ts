import { it, expect, describe } from 'vitest'
import { getThresholdIntersections, mergeThresholdIntersections, type ThresholdIntersection } from './ThresholdPlugin'
import type { Threshold } from 'src/types'

describe('getThresholdIntersections', () => {
  it('returns empty array when no datasets are visible', () => {
    const chart = {
      data: {
        datasets: [
          { data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
        ],
      },
      getDatasetMeta: () => ({ visible: false }),
    } as any

    const thresholds: Threshold[] = [{ type: 'error', value: 15, highlightIntersections: true }]
    const result = getThresholdIntersections(chart, thresholds)
    expect(result).toEqual([])
  })
  it('detects intersections correctly', () => {
    const chart = {
      data: {
        datasets: [
          { data: [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 10 }] },
        ],
      },
      getDatasetMeta: () => ({ visible: true }),
    } as any

    const thresholds: Threshold[] = [{ type: 'error', value: 15, highlightIntersections: true }]
    const result = getThresholdIntersections(chart, thresholds)
    expect(result).toEqual([
      { start: 1.5, end: 2.5, type: 'error' },
    ])
  })

  it('merges overlapping intersections of the same type', () => {
    const intersections: ThresholdIntersection[] = [
      { start: 1, end: 3, type: 'error' },
      { start: 2, end: 4, type: 'error' },
      { start: 5, end: 6, type: 'warning' },
      { start: 6, end: 7, type: 'warning' },
    ]
    const result = mergeThresholdIntersections(intersections)
    expect(result).toEqual([
      { start: 1, end: 4, type: 'error' },
      { start: 5, end: 7, type: 'warning' },
    ])
  })
})
