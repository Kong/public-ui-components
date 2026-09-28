import type { DisplayBlob, ExploreResultV4, GroupByResult, QueryResponseMeta } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect, vi } from 'vitest'
import { exploreResultToHeatmap } from './heatmap-adapters'

// Local times (no `Z`), so day labels don't depend on the test runner's timezone
const START = '2024-06-16T00:00:00'
const END = '2024-06-19T00:00:00'

const DISPLAY: DisplayBlob = {
  route: {
    r1: { name: 'Route one' },
    r2: { name: 'Route two' },
  },
}

const exploreResult = (
  data: GroupByResult[],
  meta: Partial<QueryResponseMeta> = {},
): ExploreResultV4 => ({
  data,
  meta: {
    start: START,
    end: END,
    granularity_ms: 86400000,
    display: DISPLAY,
    metric_names: ['request_count'],
    query_id: '',
    ...meta,
  } as QueryResponseMeta,
})

describe('exploreResultToHeatmap', () => {
  it('returns undefined for missing input', () => {
    expect(exploreResultToHeatmap(undefined)).toBeUndefined()
  })

  it('returns undefined and logs when the metric or dimension is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(exploreResultToHeatmap(exploreResult([], { metric_names: [] }))).toBeUndefined()
    expect(exploreResultToHeatmap(exploreResult([], { display: {} }))).toBeUndefined()
    expect(errorSpy).toHaveBeenCalledTimes(2)
    errorSpy.mockRestore()
  })

  it('builds a column per day, excluding the end day', () => {
    expect(exploreResultToHeatmap(exploreResult([]))?.xAxisLabels).toEqual(['Jun 16', 'Jun 17', 'Jun 18'])
  })

  it('maps records to cells with rows in first-seen order', () => {
    const result = exploreResultToHeatmap(exploreResult([
      { timestamp: '2024-06-17T00:00:00', event: { route: 'r2', request_count: 5 } },
      { timestamp: '2024-06-16T00:00:00', event: { route: 'r1', request_count: '2.5' } },
      { timestamp: '2024-06-18T00:00:00', event: { route: 'r2', request_count: 7 } },
    ]))

    expect(result?.yAxisLabels).toEqual(['Route two', 'Route one'])
    expect(result?.data).toEqual([[1, 0, 5], [0, 1, 2.5], [2, 0, 7]])
  })

  it('skips records outside the time range or without a numeric value', () => {
    const result = exploreResultToHeatmap(exploreResult([
      { timestamp: '2024-06-20T00:00:00', event: { route: 'r1', request_count: 1 } },
      { timestamp: '2024-06-16T00:00:00', event: { route: 'r1', request_count: null } },
      { timestamp: '2024-06-16T00:00:00', event: { route: 'r2', request_count: 3 } },
    ]))

    expect(result?.yAxisLabels).toEqual(['Route two'])
    expect(result?.data).toEqual([[0, 0, 3]])
  })

  it('keeps separate rows for ids that share a display name', () => {
    const display: DisplayBlob = { route: { r1: { name: 'Same' }, r2: { name: 'Same' } } }
    const result = exploreResultToHeatmap(exploreResult([
      { timestamp: START, event: { route: 'r1', request_count: 1 } },
      { timestamp: START, event: { route: 'r2', request_count: 2 } },
    ], { display }))

    expect(result?.yAxisLabels).toEqual(['Same', 'Same'])
    expect(result?.data).toEqual([[0, 0, 1], [0, 1, 2]])
  })

  it('falls back to the id when the display blob has no name for it', () => {
    const result = exploreResultToHeatmap(exploreResult([
      { timestamp: START, event: { route: 'unknown', request_count: 1 } },
    ]))

    expect(result?.yAxisLabels).toEqual(['unknown'])
  })

  it('ignores a `time` key in the display blob', () => {
    const display: DisplayBlob = { time: {}, ...DISPLAY }
    const result = exploreResultToHeatmap(exploreResult([
      { timestamp: START, event: { route: 'r1', request_count: 1 } },
    ], { display }))

    expect(result?.yAxisLabels).toEqual(['Route one'])
  })
})
