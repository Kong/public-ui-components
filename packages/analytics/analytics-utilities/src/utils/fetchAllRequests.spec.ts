import type { ApiRequestsDatasourceQuery, ApiRequestsResult, RequestRecord } from '../types'

import { describe, it, expect, vi } from 'vitest'

import { DEFAULT_MAX_REQUEST_RECORDS, fetchAllRequests } from './fetchAllRequests'

const record = (i: number): RequestRecord => ({
  request_id: `req-${i}`,
  request_start: new Date(i * 1000).toISOString(),
  latencies_response_ms: i,
  latencies_kong_gateway_ms: 0,
  latencies_upstream_ms: 0,
  latencies_kong_internal_ms: 0,
  request_body_size: 0,
  response_body_size: 0,
  response_header_content_length: 0,
})

const query: ApiRequestsDatasourceQuery = {
  datasource: 'api_requests',
  query: {
    filters: [],
    time_range: { type: 'relative', time_range: '1H' },
  },
}

const pagedServer = (total: number) => {
  const fetchPage = vi.fn(async ({ query }: ApiRequestsDatasourceQuery): Promise<ApiRequestsResult> => {
    const offset = query.cursor ? Number(query.cursor) : 0
    const size = query.size ?? total
    const results = Array.from({ length: Math.min(size, total - offset) }, (_, i) => record(offset + i))
    const next = offset + results.length

    return {
      results,
      meta: {
        query_id: 'q',
        time_range: { start: 's', end: 'e' },
        size: results.length,
        ...(next < total ? { cursor: String(next) } : {}),
      },
    }
  })

  return fetchPage
}

describe('fetchAllRequests', () => {
  const controller = new AbortController()

  it('returns a single page when the server has no cursor', async () => {
    const fetchPage = pagedServer(5)
    const result = await fetchAllRequests(fetchPage, query, controller)

    expect(fetchPage).toHaveBeenCalledOnce()
    expect(result.results).toHaveLength(5)
    expect(result.truncated).toBe(false)
    expect(result.meta.size).toBe(5)
  })

  it('follows cursors serially until the server runs out', async () => {
    const fetchPage = pagedServer(2500)
    const result = await fetchAllRequests(fetchPage, query, controller)

    expect(fetchPage).toHaveBeenCalledTimes(3)
    expect(fetchPage.mock.calls.map(([q]) => q.query.cursor)).toEqual([undefined, '1000', '2000'])
    expect(result.results).toHaveLength(2500)
    expect(result.results.at(-1)?.request_id).toBe('req-2499')
    expect(result.truncated).toBe(false)
  })

  it('stops at the ceiling and reports truncation when more remained', async () => {
    const fetchPage = pagedServer(5000)
    const result = await fetchAllRequests(fetchPage, query, controller, { maxRecords: 2500 })

    expect(fetchPage).toHaveBeenCalledTimes(3)
    expect(fetchPage.mock.calls.map(([q]) => q.query.size)).toEqual([1000, 1000, 500])
    expect(result.results).toHaveLength(2500)
    expect(result.truncated).toBe(true)
    expect(result.limit).toBe(2500)
  })

  it('is not truncated when the ceiling lands exactly on the last record', async () => {
    const fetchPage = pagedServer(2000)
    const result = await fetchAllRequests(fetchPage, query, controller, { maxRecords: 2000 })

    expect(result.results).toHaveLength(2000)
    expect(result.truncated).toBe(false)
  })

  it('defaults the ceiling', async () => {
    const fetchPage = pagedServer(DEFAULT_MAX_REQUEST_RECORDS + 1)
    const result = await fetchAllRequests(fetchPage, query, controller)

    expect(result.results).toHaveLength(DEFAULT_MAX_REQUEST_RECORDS)
    expect(result.truncated).toBe(true)
  })

  it('caps the page size at the server maximum', async () => {
    const fetchPage = pagedServer(10)
    await fetchAllRequests(fetchPage, query, controller, { pageSize: 5000 })

    expect(fetchPage.mock.calls[0][0].query.size).toBe(1000)
  })

  it('reports progress after every page', async () => {
    const fetchPage = pagedServer(2500)
    const onPage = vi.fn()
    await fetchAllRequests(fetchPage, query, controller, { onPage })

    expect(onPage.mock.calls.map(([received]) => received)).toEqual([1000, 2000, 2500])
  })

  it('handles an empty result', async () => {
    const fetchPage = pagedServer(0)
    const result = await fetchAllRequests(fetchPage, query, controller)

    expect(result.results).toEqual([])
    expect(result.truncated).toBe(false)
  })
})
