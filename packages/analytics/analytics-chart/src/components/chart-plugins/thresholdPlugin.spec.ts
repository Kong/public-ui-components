import { it, expect, describe } from 'vitest'
import { getThresholdIntersections, mergeThresholdIntersections, type ThresholdIntersection } from './ThresholdPlugin'
import type { Threshold } from 'src/types'

describe('thresholdPlugin', () => {
  describe('getThresholdIntersections', () => {
    const getResult = ({
      datasets,
      thresholds = [],
      hiddenDatasetIndices = [],
    }: {
      datasets: Array<{
        data: Array<{ x: number, y: number }>
      }>
      thresholds?: Threshold[]
      hiddenDatasetIndices?: number[]
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

      return getThresholdIntersections(chart, thresholds)
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
