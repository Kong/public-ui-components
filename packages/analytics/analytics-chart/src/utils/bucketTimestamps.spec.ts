import bucketTimestamps from './bucketTimestamps'
import { describe, it, expect } from 'vitest'

describe('bucketTimestamps', () => {
  it('creates a range of buckets', () => {
    expect(bucketTimestamps({
      maxStamp: 3000,
      minStamp: 0,
      groupSizeMs: 1000,
      timestamps: [],
    })).toEqual([
      [0, 0],
      [1000, 0],
      [2000, 0],
      [3000, 0],
    ])
  })

  it('fills buckets with counts of stamps', () => {
    expect(bucketTimestamps({
      maxStamp: 3000,
      minStamp: 0,
      groupSizeMs: 1000,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([
      [0, 3],
      [1000, 0],
      [2000, 0],
      [3000, 1],
    ])
  })

  it('ignores stamps outside the given range', () => {
    expect(bucketTimestamps({
      maxStamp: 3000,
      minStamp: 0,
      groupSizeMs: 1000,
      timestamps: [-1, 3001],
    })).toEqual([
      [0, 0],
      [1000, 0],
      [2000, 0],
      [3000, 0],
    ])
  })

  it('returns an empty list when min and max don\'t form a valid range', () => {
    expect(bucketTimestamps({
      maxStamp: 0,
      minStamp: 3000,
      groupSizeMs: 1000,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([])

    expect(bucketTimestamps({
      maxStamp: 1,
      minStamp: 1,
      groupSizeMs: 1000,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([])
  })
})

