import { describe, it, expect } from 'vitest'
import { getUnitFromAggregationName, AggregationUnit } from './getUnitFromAggregationName'
import { type AllAggregations } from '../types/explore/all'
import { basicExploreAggregations, exploreAggregations, aiExploreAggregations } from '../'

describe('getUnitFromAggregationName', () => {
  it('returns a value for every aggregation name', () => {
    const validUnits = Object.values(AggregationUnit)

    const allAggregations = [
      ...basicExploreAggregations,
      ...exploreAggregations,
      ...aiExploreAggregations,
    ]

    allAggregations.forEach((name) => {
      const unit = getUnitFromAggregationName(name)
      expect(validUnits).toContain(unit)
    })
  })

  it.each([
    [AggregationUnit.ms, 'latency'],
    [AggregationUnit.bytes, 'size'],
    [AggregationUnit.countPerMinute, 'perminute'],
    [AggregationUnit.countPerMinute, 'per_minute'],
    [AggregationUnit.tokenCount, 'token'],
    [AggregationUnit.usd, 'cost'],
    [AggregationUnit.count, 'count'],
  ])('returns \'%s\' when metric includes \'%s\'', (unit, metric) => {
    const mockAggregationName = `Mock ${metric} metric` as AllAggregations
    expect(getUnitFromAggregationName(mockAggregationName)).toEqual(unit)
  })
})

