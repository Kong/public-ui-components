import type { DisplayBlob, ExploreResultV4, FetchAllRequestsResult, QueryResponseMeta, RequestRecord } from '@kong-ui-public/analytics-utilities'
import { describe, it, expect, vi } from 'vitest'
import { exploreResultToScatterData, requestsToScatterData } from './scatter-adapters'

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

describe('requestsToScatterData', () => {
  const requestsResult = (results: RequestRecord[]): FetchAllRequestsResult => ({
    results,
    meta: {
      query_id: '',
      time_range: { start: START, end: END },
      size: results.length,
    },
    truncated: true,
    limit: 10_000,
  })

  const flatRecords: RequestRecord[] = [
    { request_start: START, latencies_response_ms: 12, route: 'a' },
    { request_start: END, latencies_response_ms: 34, route: 'b' },
  ]

  it('returns undefined for missing input', () => {
    expect(requestsToScatterData(undefined, { metric: 'latencies_response_ms' })).toBeUndefined()
  })

  it('returns undefined and logs when the metric is missing', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementationOnce(() => {})

    expect(requestsToScatterData(requestsResult(flatRecords), { metric: '' })).toBeUndefined()
    expect(errorSpy).toHaveBeenCalledOnce()
    errorSpy.mockRestore()
  })

  it('plots one point per record with no dimension', () => {
    const data = requestsToScatterData(requestsResult(flatRecords), { metric: 'latencies_response_ms' })!

    expect(data.points).toEqual([
      { timestamp: new Date(START).valueOf(), value: 12 },
      { timestamp: new Date(END).valueOf(), value: 34 },
    ])
    expect(data.dimension).toBeUndefined()
  })

  it('groups points by a dimension', () => {
    const records = [...flatRecords, { request_start: END, latencies_response_ms: 56, route: '' }]
    const data = requestsToScatterData(requestsResult(records), {
      metric: 'latencies_response_ms',
      dimension: 'route',
    })!

    expect(data.points.map(p => p.group)).toEqual(['a', 'b', 'empty'])
  })

  it('drops records whose metric is null, empty or invalid', () => {
    const records: RequestRecord[] = [
      { request_start: START, latencies_response_ms: null },
      { request_start: START, latencies_response_ms: '' },
      { request_start: START, latencies_response_ms: 'nope' },
      { request_start: 'not a date', latencies_response_ms: 12 },
      { request_start: START },
      { request_start: START, latencies_response_ms: 12 },
    ]

    expect(requestsToScatterData(requestsResult(records), { metric: 'latencies_response_ms' })!.points)
      .toEqual([{ timestamp: new Date(START).valueOf(), value: 12 }])
  })

  it('reads a dotted path off the record', () => {
    const records: RequestRecord[] = [{ request_start: START, mcp_info: { rpc: [{ latency: 7 }] } }]
    const data = requestsToScatterData(requestsResult(records), { metric: 'mcp_info.rpc.0.latency' })!

    expect(data.points).toEqual([{ timestamp: new Date(START).valueOf(), value: 7 }])
  })

  it('honors a custom timestamp field', () => {
    const records: RequestRecord[] = [{ started_at: START, latencies_response_ms: 12 }]
    const data = requestsToScatterData(requestsResult(records), {
      metric: 'latencies_response_ms',
      timestamp: 'started_at',
    })!

    expect(data.points).toEqual([{ timestamp: new Date(START).valueOf(), value: 12 }])
  })

  describe('unroll', () => {
    const nestedRecords: RequestRecord[] = [
      {
        request_start: START,
        route: 'a',
        ai: [{ cost: 1, providerName: 'openai' }, { cost: 2, providerName: 'anthropic' }],
      },
      { request_start: END, route: 'b', latencies_response_ms: 34 },
    ]

    it('plots one point per nested entry, sharing the parent timestamp', () => {
      const data = requestsToScatterData(requestsResult(nestedRecords), { metric: 'cost', unroll: 'ai' })!

      expect(data.points).toEqual([
        { timestamp: new Date(START).valueOf(), value: 1 },
        { timestamp: new Date(START).valueOf(), value: 2 },
      ])
    })

    it('groups unrolled points by a field on the entry', () => {
      const data = requestsToScatterData(requestsResult(nestedRecords), {
        metric: 'cost',
        dimension: 'providerName',
        unroll: 'ai',
      })!

      expect(data.points.map(p => p.group)).toEqual(['openai', 'anthropic'])
    })

    it('falls back to the parent record for a dimension the entry lacks', () => {
      const data = requestsToScatterData(requestsResult(nestedRecords), {
        metric: 'cost',
        dimension: 'route',
        unroll: 'ai',
      })!

      expect(data.points.map(p => p.group)).toEqual(['a', 'a'])
    })

    it('ignores a collection that is not an array', () => {
      const records: RequestRecord[] = [{ request_start: START, ai: { cost: 1 } }]

      expect(requestsToScatterData(requestsResult(records), { metric: 'cost', unroll: 'ai' })!.points).toEqual([])
    })
  })
})

describe('requestsToScatterData extras', () => {
  const result = (results: RequestRecord[]): FetchAllRequestsResult => ({
    results,
    meta: { query_id: '', time_range: { start: START, end: END }, size: results.length },
    truncated: false,
    limit: 10_000,
  })

  const records: RequestRecord[] = [{
    request_start: START,
    route: 'checkout',
    ai: [{ cost: 0.1, totalTokens: 2426, providerName: 'openai' }],
  }]

  it('annotates a point with the requested fields', () => {
    const data = requestsToScatterData(result(records), {
      metric: 'cost',
      unroll: 'ai',
      extraFields: [
        { field: 'totalTokens', label: 'Tokens', unit: 'token count' },
        { field: 'providerName', label: 'Provider' },
      ],
    })!

    expect(data.points[0].extras).toEqual([
      { label: 'Tokens', value: 2426, unit: 'token count' },
      { label: 'Provider', value: 'openai' },
    ])
  })

  it('falls back to the parent record for a field the entry lacks', () => {
    const data = requestsToScatterData(result(records), {
      metric: 'cost',
      unroll: 'ai',
      extraFields: [{ field: 'route', label: 'Route' }],
    })!

    expect(data.points[0].extras).toEqual([{ label: 'Route', value: 'checkout' }])
  })

  it('defaults the label to the field name', () => {
    const data = requestsToScatterData(result(records), {
      metric: 'cost',
      unroll: 'ai',
      extraFields: [{ field: 'providerName' }],
    })!

    expect(data.points[0].extras).toEqual([{ label: 'providerName', value: 'openai' }])
  })

  it('skips fields the record does not carry rather than showing them blank', () => {
    const data = requestsToScatterData(result(records), {
      metric: 'cost',
      unroll: 'ai',
      extraFields: [
        { field: 'nope', label: 'Missing' },
        { field: 'providerName', label: 'Provider' },
      ],
    })!

    expect(data.points[0].extras).toEqual([{ label: 'Provider', value: 'openai' }])
  })

  it('leaves extras undefined when every field is missing', () => {
    const data = requestsToScatterData(result(records), {
      metric: 'cost',
      unroll: 'ai',
      extraFields: [{ field: 'nope' }],
    })!

    expect(data.points[0].extras).toBeUndefined()
  })

  it('leaves extras undefined when none are requested', () => {
    const data = requestsToScatterData(result(records), { metric: 'cost', unroll: 'ai' })!

    expect(data.points[0].extras).toBeUndefined()
  })
})
