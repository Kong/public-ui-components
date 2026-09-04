import type { AnalyticsBridge, ApiRequestsDatasourceQuery, ApiRequestsResult, RequestRecord } from '../types'

import { API_REQUESTS_MAX_PAGE_SIZE } from '../types'

export const DEFAULT_MAX_REQUEST_RECORDS = 10_000

export interface FetchAllRequestsOptions {
  maxRecords?: number
  pageSize?: number
  onPage?: (received: number, page: ApiRequestsResult) => void
}

export interface FetchAllRequestsResult extends ApiRequestsResult {
  truncated: boolean
  limit: number
}

/**
 * Pages through until the server runs out of records or the ceiling is reached
 */
export const fetchAllRequests = async (
  fetchPage: NonNullable<AnalyticsBridge['requestsQueryFn']>,
  query: ApiRequestsDatasourceQuery,
  abortController: AbortController,
  options: FetchAllRequestsOptions = {},
): Promise<FetchAllRequestsResult> => {
  const maxRecords = Math.max(0, options.maxRecords ?? DEFAULT_MAX_REQUEST_RECORDS)
  const pageSize = Math.min(API_REQUESTS_MAX_PAGE_SIZE, Math.max(1, options.pageSize ?? API_REQUESTS_MAX_PAGE_SIZE))

  const results: RequestRecord[] = []
  let cursor: string | undefined = query.query.cursor
  let lastPage: ApiRequestsResult | undefined

  while (results.length < maxRecords) {
    const size = Math.min(pageSize, maxRecords - results.length)

    const page: ApiRequestsResult = await fetchPage({
      datasource: query.datasource,
      query: {
        ...query.query,
        size,
        ...(cursor ? { cursor } : {}),
      },
    }, abortController)

    lastPage = page
    results.push(...(page.results ?? []))
    options.onPage?.(results.length, page)

    cursor = page.meta?.cursor

    if (!cursor || !page.results?.length || page.results.length < size) {
      break
    }
  }

  return {
    results,
    meta: {
      ...(lastPage?.meta ?? { query_id: '', time_range: { start: '', end: '' }, size: 0 }),
      size: results.length,
    },
    truncated: !!cursor && results.length >= maxRecords,
    limit: maxRecords,
  }
}
