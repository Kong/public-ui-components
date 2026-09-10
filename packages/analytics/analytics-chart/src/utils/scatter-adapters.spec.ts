import type { DisplayBlob, ExploreResultV4, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect, vi } from 'vitest'
import { exploreResultToScatterData } from './scatter-adapters'

const START = '2024-06-16T00:00:00.000Z'
const END = '2024-06-16T00:00:10.000Z'

describe('exploreResultToScatterData', () => {
  const exploreResult = (display: DisplayBlob = {} as DisplayBlob): ExploreResultV4 => ({
    data: [
      { timestamp: START, event: { cost: 1, route: 'a' } },
      { timestamp: END, event: { cost: 2, route: 'b' } },
    ],
    meta: {
      start: START,
      end: END,
      granularity_ms: 1000,
      display,
      metric_names: ['cost'],
      metric_units: { cost: 'count' },
      query_id: '',
      truncated: true,
      limit: 50,
    } as unknown as QueryResponseMeta,
  })

  it('returns undefined for missing input', () => {
    expect(exploreResultToScatterData(undefined)).toBeUndefined()
  })

  it('returns undefined and logs when metric names are missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementationOnce(() => {})
    const result = { data: [], meta: { start: START, end: END, display: {} } } as unknown as ExploreResultV4

    expect(exploreResultToScatterData(result)).toBeUndefined()
    expect(errorSpy).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })

  it('plots one point per record with no dimension', () => {
    const data = exploreResultToScatterData(exploreResult())!

    expect(data.points).toEqual([
      { timestamp: new Date(START).valueOf(), value: 1 },
      { timestamp: new Date(END).valueOf(), value: 2 },
    ])
    expect(data.metric).toBe('cost')
    expect(data.metricUnit).toBe('count')
    expect(data.dimension).toBeUndefined()
    expect(data.display).toBeUndefined()
  })

  it('carries the first dimension and its display names', () => {
    const display = { route: { a: { name: 'Route A' }, b: { name: 'Route B' } } } as DisplayBlob
    const data = exploreResultToScatterData(exploreResult(display))!

    expect(data.dimension).toBe('route')
    expect(data.display).toEqual(display.route)
    expect(data.points.map(p => p.group)).toEqual(['a', 'b'])
  })

  it('passes through the query window and truncation bookkeeping', () => {
    const data = exploreResultToScatterData(exploreResult())!

    expect(data).toMatchObject({ start: START, end: END, truncated: true, limit: 50 })
  })
})
