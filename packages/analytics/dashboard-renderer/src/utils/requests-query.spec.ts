import type { ApiRequestsQuery } from '@kong-ui-public/analytics-utilities'

import { describe, expect, it } from 'vitest'

import { toRequestsScatterOptions, toRequestsTimeRange } from './requests-query'

describe('toRequestsTimeRange', () => {
  it('uppercases a relative time range', () => {
    expect(toRequestsTimeRange({ type: 'relative', time_range: '7d' })).toEqual({ type: 'relative', time_range: '7D' })
  })

  it('keeps the timezone', () => {
    expect(toRequestsTimeRange({ type: 'relative', time_range: '1h', tz: 'UTC' }))
      .toEqual({ type: 'relative', time_range: '1H', tz: 'UTC' })
  })

  it('passes an absolute time range through', () => {
    const start = new Date('2024-06-16T00:00:00.000Z')
    const end = new Date('2024-06-16T01:00:00.000Z')

    expect(toRequestsTimeRange({ type: 'absolute', start, end, tz: 'UTC' }))
      .toEqual({ type: 'absolute', start, end, tz: 'UTC' })
  })

  it('defaults to 24H when there is no time range', () => {
    expect(toRequestsTimeRange(undefined)).toEqual({ type: 'relative', time_range: '24H' })
  })

  it('defaults to 24H for a range the endpoint does not support', () => {
    expect(toRequestsTimeRange({ type: 'relative', time_range: 'current_week', tz: 'UTC' }))
      .toEqual({ type: 'relative', time_range: '24H', tz: 'UTC' })
  })
})

describe('toRequestsScatterOptions', () => {
  const query = (overrides: Partial<ApiRequestsQuery> = {}): ApiRequestsQuery => ({
    datasource: 'requests',
    metric: 'latencies_response_ms',
    ...overrides,
  })

  it('maps the metric and its unit', () => {
    expect(toRequestsScatterOptions(query())).toEqual({ metric: 'latencies_response_ms', metricUnit: 'ms' })
  })

  it('maps query field names to the record keys they come back under', () => {
    expect(toRequestsScatterOptions(query({ metric: 'status_code', dimension: 'upstream_status_code' })))
      .toEqual({ metric: 'response_http_status', dimension: 'upstream_status' })
  })

  it('carries unroll and extra fields through', () => {
    const extraFields = [{ field: 'totalTokens', label: 'Tokens', unit: 'token count' }]

    expect(toRequestsScatterOptions(query({ metric: 'cost', unroll: 'ai', dimension: 'providerName', extra_fields: extraFields })))
      .toEqual({ metric: 'cost', metricUnit: 'usd', unroll: 'ai', dimension: 'providerName', extraFields })
  })
})
