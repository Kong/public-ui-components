import type { TableDataGridFetcher } from '../types'
import { ref, type Ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import {
  createDeferred,
  createFetchHarness,
  createPaginationFetchParams,
  createRows,
  type TestRow,
} from '../test-utils/tableDataGridFetch'
import { useTableDataGridPaginationFetch } from './useTableDataGridPaginationFetch'

const createPaginationFetch = (
  fetcher: TableDataGridFetcher<TestRow> | Ref<TableDataGridFetcher<TestRow>>,
) => {
  const harness = createFetchHarness({
    fetcher: typeof fetcher === 'function' ? ref(fetcher) : fetcher,
    params: createPaginationFetchParams(),
  })

  return {
    ...harness,
    ...useTableDataGridPaginationFetch<TestRow>(harness.sources),
  }
}

const createPendingPaginationRequests = () => {
  const firstRequest = createDeferred<{
    data: TestRow[]
    total: number
  }>()
  const secondRequest = createDeferred<{
    data: TestRow[]
    total: number
  }>()
  const fetcher = vi.fn()
    .mockReturnValueOnce(firstRequest.promise)
    .mockReturnValueOnce(secondRequest.promise)
  const paginationFetch = createPaginationFetch(fetcher as TableDataGridFetcher<TestRow>)

  return {
    firstFetch: paginationFetch.fetchPage(1),
    firstRequest,
    paginationFetch,
    secondFetch: paginationFetch.fetchPage(2),
    secondRequest,
  }
}

describe('useTableDataGridPaginationFetch', () => {
  it('only commits the latest pagination request result', async () => {
    const {
      firstFetch,
      firstRequest,
      paginationFetch,
      secondFetch,
      secondRequest,
    } = createPendingPaginationRequests()

    secondRequest.resolve({
      data: [{ id: 'row-2', name: 'Second', status: 200 }],
      total: 2,
    })
    await secondFetch
    firstRequest.resolve({
      data: [{ id: 'row-1', name: 'First', status: 200 }],
      total: 1,
    })
    await firstFetch

    expect(paginationFetch.rowData.value).toEqual([{ id: 'row-2', name: 'Second', status: 200 }])
    expect(paginationFetch.totalRows.value).toBe(2)
    expect(paginationFetch.currentPage.value).toBe(2)
  })

  it('does not mark stale pagination requests as fetched', async () => {
    const {
      firstFetch,
      firstRequest,
      paginationFetch,
      secondFetch,
      secondRequest,
    } = createPendingPaginationRequests()

    firstRequest.resolve({
      data: [{ id: 'row-1', name: 'First', status: 200 }],
      total: 2,
    })
    await firstFetch
    expect(paginationFetch.hasFetched.value).toBe(false)

    secondRequest.resolve({
      data: [{ id: 'row-2', name: 'Second', status: 200 }],
      total: 2,
    })
    await secondFetch

    expect(paginationFetch.hasFetched.value).toBe(true)
  })

  it('can invalidate in-flight pagination requests', async () => {
    const request = createDeferred<{
      data: TestRow[]
      total: number
    }>()
    const fetcher = vi.fn().mockReturnValueOnce(request.promise)
    const paginationFetch = createPaginationFetch(fetcher as TableDataGridFetcher<TestRow>)

    const fetch = paginationFetch.fetchPage(1)
    paginationFetch.invalidatePaginationRequests()
    request.resolve({
      data: [{ id: 'row-1', name: 'First', status: 200 }],
      total: 1,
    })
    await fetch

    expect(paginationFetch.rowData.value).toEqual([])
    expect(paginationFetch.totalRows.value).toBeUndefined()
    expect(paginationFetch.hasFetched.value).toBe(false)
  })

  it('resets fetched state through the fetcher-owned reset callback', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1', name: 'First', status: 200 }],
      total: 1,
    })
    const paginationFetch = createPaginationFetch(fetcher as TableDataGridFetcher<TestRow>)

    await paginationFetch.fetchPage(1)
    expect(paginationFetch.hasFetched.value).toBe(true)

    paginationFetch.resetFetched()

    expect(paginationFetch.hasFetched.value).toBe(false)
  })

  it('uses the latest fetcher ref when fetching', async () => {
    const initialFetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'row-1', name: 'Initial', status: 200 }],
      total: 1,
    })
    const latestFetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'row-2', name: 'Latest', status: 200 }],
      total: 1,
    })
    const fetcher = ref<TableDataGridFetcher<TestRow>>(initialFetcher)
    const paginationFetch = createPaginationFetch(fetcher)

    fetcher.value = latestFetcher
    await paginationFetch.fetchPage(1)

    expect(initialFetcher).not.toHaveBeenCalled()
    expect(latestFetcher).toHaveBeenCalledOnce()
    expect(paginationFetch.rowData.value).toEqual([{ id: 'row-2', name: 'Latest', status: 200 }])
  })

  it('uses hasMore when total rows are omitted instead of inferring only from page size', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      data: createRows('row', 15),
      hasMore: false,
    }).mockResolvedValueOnce({
      data: createRows('short-row', 1),
      hasMore: true,
    })
    const paginationFetch = createPaginationFetch(fetcher as TableDataGridFetcher<TestRow>)

    await paginationFetch.fetchPage(1)
    expect(paginationFetch.hasNextPageWhenTotalUnknown.value).toBe(true)

    await paginationFetch.fetchPage(2)
    expect(paginationFetch.hasNextPageWhenTotalUnknown.value).toBe(false)
    expect(paginationFetch.totalRows.value).toBeUndefined()
  })

  it('infers unknown-total next-page state from returned page size when hasMore is omitted', async () => {
    const fullPageFetcher = vi.fn().mockResolvedValue({
      data: createRows('full-row', 15),
    })
    const partialPageFetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'partial-row-1', name: 'Partial row 1', status: 200 }],
    })
    const fetcher = ref<TableDataGridFetcher<TestRow>>(fullPageFetcher)
    const paginationFetch = createPaginationFetch(fetcher)

    await paginationFetch.fetchPage(1)
    expect(paginationFetch.hasNextPageWhenTotalUnknown.value).toBe(true)

    fetcher.value = partialPageFetcher
    await paginationFetch.fetchPage(2)
    expect(paginationFetch.hasNextPageWhenTotalUnknown.value).toBe(false)
  })
})
