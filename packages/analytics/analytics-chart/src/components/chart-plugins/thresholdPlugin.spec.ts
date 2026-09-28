import { it, expect, describe } from 'vitest'
import { getThresholdIntersections, mergeThresholdIntersections, thresholdAxisId, type ThresholdIntersection } from './ThresholdPlugin'
import type { Threshold } from 'src/types'

describe('thresholdPlugin', () => {
  describe('getThresholdIntersections', () => {
    const getResult = ({
      datasets,
      thresholds = [],
      hiddenDatasetIndices = [],
      axisId,
    }: {
      datasets: Array<{
        data: Array<{ x: number, y: number }>
        yAxisID?: string
      }>
      thresholds?: Threshold[]
      hiddenDatasetIndices?: number[]
      axisId?: string
    }) => {
      const chart = {
        data: {
          datasets,
        },
        getDatasetMeta: (index: number) => {
          return {
            visible: !hiddenDatasetIndices.includes(index),
          }
        },
      } as any

      return getThresholdIntersections(chart, thresholds, axisId)
    }

    it('returns an empty array when no datasets are visible', () => {
      const result = getResult({
        datasets: [{ data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] }],
        thresholds: [{ type: 'error', value: 15, highlightIntersections: true }],
        hiddenDatasetIndices: [0],
      })
      expect(result).toEqual([])
    })

    it('returns an empty array when all datapoints are below the threshold', () => {
      const result = getResult({
        datasets: [{ data: [{ x: 1, y: 10 }, { x: 2, y: 10 }] }],
        thresholds: [{ type: 'error', value: 15, highlightIntersections: true }],
      })
      expect(result).toEqual([])
    })

    it.each([
      ['rise above at beginning', [10, 20, 20], 1.5, 3],
      ['rise above at middle', [10, 20, 10], 1.5, 2.5],
      ['rise above at end', [10, 10, 20], 2.5, 3],
      ['fall below at beginning', [20, 10, 10], 1, 1.5],
      ['stay fully above', [20, 20], 1, 2],
    ])('Detects threshold line intersections that %s', (title, yValues, expectedStart, expectedEnd) => {
      const result = getResult({
        datasets: [{ data: yValues.map((y, index) => ({ x: index + 1, y })) }],
        thresholds: [{ type: 'error', value: 15, highlightIntersections: true }],
      })

      expect(result).toEqual([
        { start: expectedStart, end: expectedEnd, type: 'error' },
      ])
    })

    it('Detects multiple threshold intersections', () => {
      const result = getResult({
        datasets: [{ data: [
          { x: 1, y: 20 },
          { x: 2, y: 10 },
          { x: 3, y: 20 },
          { x: 4, y: 10 },
          { x: 5, y: 20 },
          { x: 5, y: 10 },
        ] }],
        thresholds: [{ type: 'error', value: 15, highlightIntersections: true }],
      })

      expect(result).toEqual([
        { start: 1, end: 1.5, type: 'error' },
        { start: 2.5, end: 3.5, type: 'error' },
        { start: 4.5, end: 5, type: 'error' },
      ])
    })
  })

  describe('y axes', () => {
    const datasets = [
      { rawMetric: 'request_count', data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      { rawMetric: 'response_latency_p99', yAxisID: 'y1', data: [{ x: 1, y: 100 }, { x: 2, y: 200 }] },
    ]
    const chart = { data: { datasets }, getDatasetMeta: () => ({ visible: true }) } as any
    const threshold: Threshold[] = [{ type: 'error', value: 150, highlightIntersections: true }]

    it('resolves the axis a metric is plotted on', () => {
      expect(thresholdAxisId(chart, 'request_count')).toBe('y')
      expect(thresholdAxisId(chart, 'response_latency_p99')).toBe('y1')
      expect(thresholdAxisId(chart, 'unknown_metric')).toBe('y')
    })

    it('only intersects datasets on the threshold axis', () => {
      expect(getThresholdIntersections(chart, threshold, 'y')).toEqual([])
      expect(getThresholdIntersections(chart, threshold, 'y1')).toEqual([{ start: 1.5, end: 2, type: 'error' }])
    })
  })

  describe('mergeThresholdIntersections', () => {
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
})
