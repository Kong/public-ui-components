import bucketTimestamps from './bucketTimestamps'
import { describe, it, expect } from 'vitest'

describe('bucketTimestamps', () => {
  it('creates a range of buckets', () => {
    expect(bucketTimestamps({
      bucketCount: 4,
      maxStamp: 4000,
      minStamp: 0,
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
      bucketCount: 4,
      maxStamp: 4000,
      minStamp: 0,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([
      [0, 3],
      [1000, 0],
      [2000, 1],
      [3000, 0],
    ])
  })

  it('ignores stamps outside the given range', () => {
    expect(bucketTimestamps({
      bucketCount: 4,
      maxStamp: 4000,
      minStamp: 0,
      timestamps: [-1, 4001],
    })).toEqual([
      [0, 0],
      [1000, 0],
      [2000, 0],
      [3000, 0],
    ])
  })

  it('simple example', () => {
    expect(bucketTimestamps({
      bucketCount: 4,
      maxStamp: 4,
      minStamp: 1,
      timestamps: [1, 2, 3, 4],
    })).toEqual([
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
    ])
  })

  it('returns an empty list when min and max don\'t form a valid range', () => {
    // invalid because minStamp is greater than maxStamp
    expect(bucketTimestamps({
      bucketCount: 4,
      maxStamp: 0,
      minStamp: 4000,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([])

    // invalid because maxStamp is equal to minStamp
    expect(bucketTimestamps({
      bucketCount: 4,
      maxStamp: 1,
      minStamp: 1,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([])

    // invalid because there's not enough space for the requested number of buckets
    expect(bucketTimestamps({
      bucketCount: 4,
      maxStamp: 3000,
      minStamp: 2999,
      timestamps: [500, 600, 700, 3000],
    })).toEqual([])
  })
})

