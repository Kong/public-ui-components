import { describe, it, expect } from 'vitest'
import { computePercentiles, percentileOfSorted } from './percentiles'

describe('percentileOfSorted', () => {
  it('returns NaN for an empty array', () => {
    expect(percentileOfSorted([], 95)).toBeNaN()
  })

  it('returns the only value regardless of percentile', () => {
    expect(percentileOfSorted([7], 0)).toBe(7)
    expect(percentileOfSorted([7], 50)).toBe(7)
    expect(percentileOfSorted([7], 100)).toBe(7)
  })

  it('lands exactly on an index when the rank is a whole number', () => {
    expect(percentileOfSorted([1, 2, 3, 4, 5], 50)).toBe(3)
    expect(percentileOfSorted([1, 2, 3, 4, 5], 0)).toBe(1)
    expect(percentileOfSorted([1, 2, 3, 4, 5], 100)).toBe(5)
  })

  it('interpolates between neighbors', () => {
    // rank = 0.95 * 3 = 2.85, between index 2 (30) and 3 (40)
    expect(percentileOfSorted([10, 20, 30, 40], 95)).toBeCloseTo(38.5)
    // rank = 0.5 * 3 = 1.5, midway between 20 and 30
    expect(percentileOfSorted([10, 20, 30, 40], 50)).toBe(25)
  })

  it('clamps out-of-range percentiles', () => {
    expect(percentileOfSorted([1, 2, 3], -10)).toBe(1)
    expect(percentileOfSorted([1, 2, 3], 150)).toBe(3)
  })
})

describe('computePercentiles', () => {
  it('sorts the input before computing', () => {
    const result = computePercentiles([5, 1, 4, 2, 3], [50])
    expect(result.get(50)).toBe(3)
  })

  it('computes multiple percentiles', () => {
    const result = computePercentiles([1, 2, 3, 4, 5], [50, 100])
    expect(result.get(50)).toBe(3)
    expect(result.get(100)).toBe(5)
  })

  it('discards non-finite values', () => {
    const result = computePercentiles([1, NaN, 2, Infinity, 3], [50])
    expect(result.get(50)).toBe(2)
  })

  it('returns NaN entries when every value is discarded', () => {
    const result = computePercentiles([NaN, NaN], [50])
    expect(result.get(50)).toBeNaN()
  })
})
