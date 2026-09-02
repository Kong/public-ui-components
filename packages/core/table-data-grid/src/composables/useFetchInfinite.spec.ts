import type { TableDataGridFetcher, TableDataGridSort } from '../types'
import type { IDatasource, IGetRowsParams } from 'ag-grid-community'
import { describe, expect, it, vi } from 'vitest'
import { isReadonly, nextTick, ref } from 'vue'
import { useFetchInfinite } from './useFetchInfinite'

type TestRow = {
  id: string
}

const createRows = (prefix: string, length: number): TestRow[] => (
  Array.from({ length }, (_, index) => ({ id: `${prefix}-${index + 1}` }))
)

const createDeferred = <Value>() => {
  let deferredResolve!: (value: Value) => void
  let deferredReject!: (reason?: unknown) => void
  const promise = new Promise<Value>((resolve, reject) => {
    deferredResolve = resolve
    deferredReject = reject
  })

  return {
    promise,
    reject: deferredReject,
    resolve: deferredResolve,
  }
}

const createGetRowsParams = ({
  endRow,
  failCallback = vi.fn(),
  startRow,
  successCallback = vi.fn(),
}: {
  endRow: number
  failCallback?: IGetRowsParams['failCallback']
  startRow: number
  successCallback?: IGetRowsParams['successCallback']
}): IGetRowsParams => ({
  context: undefined,
  endRow,
  failCallback,
  filterModel: undefined,
  sortModel: [],
  startRow,
  successCallback,
})

const expectDatasource = (datasource: IDatasource | undefined): IDatasource => {
  expect(datasource).toBeDefined()

  return datasource as IDatasource
}

const getDatasourceRows = async (
  datasource: IDatasource,
  range: { endRow: number, startRow: number },
): Promise<{ lastRow?: number, rows: TestRow[] }> => new Promise((resolve, reject) => {
  datasource.getRows(createGetRowsParams({
    ...range,
    failCallback: reject,
    successCallback: (rowsThisBlock, lastRow) => {
      resolve({
        lastRow,
        rows: rowsThisBlock as TestRow[],
      })
    },
  }))
})

const createInfiniteFetch = (
  fetcher: TableDataGridFetcher<TestRow>,
  sort?: ReturnType<typeof ref<TableDataGridSort | undefined>>,
) => {
  const resetKey = ref(0)
  const infiniteFetch = useFetchInfinite({
    fetcher,
    resetKey,
    sort,
  })

  return {
    ...infiniteFetch,
    resetKey,
  }
}

describe('useFetchInfinite', () => {
  it('returns readonly fetch state refs', () => {
    const fetcher = vi.fn().mockResolvedValue({ data: [] })
    const { data, datasource, error, isFetching } = createInfiniteFetch(fetcher)

    expect(isReadonly(data)).toBe(true)
    expect(isReadonly(datasource)).toBe(true)
    expect(isReadonly(error)).toBe(true)
    expect(isReadonly(isFetching)).toBe(true)
  })

  it('uses the previous block cursor when fetching the next block', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 'one' }], cursor: 'cursor-1', hasMore: true })
      .mockResolvedValueOnce({ data: [{ id: 'two' }], hasMore: false })
    const { data, datasource } = createInfiniteFetch(fetcher)
    const activeDatasource = expectDatasource(datasource.value)

    const firstBlock = await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 100 })
    const secondBlock = await getDatasourceRows(activeDatasource, { startRow: 100, endRow: 200 })

    expect(fetcher).toHaveBeenNthCalledWith(1, {
      mode: 'infinite',
      pageSize: 100,
      cursor: undefined,
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, {
      mode: 'infinite',
      pageSize: 100,
      cursor: 'cursor-1',
    })
    expect(firstBlock.rows).toEqual([{ id: 'one' }])
    expect(firstBlock.lastRow).toBeUndefined()
    expect(secondBlock.rows).toEqual([{ id: 'two' }])
    expect(secondBlock.lastRow).toBe(101)
    expect(data.value).toEqual([{ id: 'one' }])
  })

  it('fails an out-of-order block until the previous block completes, then allows retry', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: createRows('block-1', 15), cursor: 'cursor-1', hasMore: true })
      .mockResolvedValueOnce({ data: createRows('block-2', 15), hasMore: false })
    const { datasource } = createInfiniteFetch(fetcher)
    const activeDatasource = expectDatasource(datasource.value)
    const failCallback = vi.fn()

    // AG Grid can request block 0, then determine it should load block 1 before
    // block 0 resolves due to viewport size, row buffering, scroll position, or
    // cache preloading. Cursor-backed APIs need block 0's response cursor before
    // fetching block 1, so fail this attempt and let AG Grid retry after the
    // prior block completes.
    await (activeDatasource.getRows(createGetRowsParams({
      startRow: 15,
      endRow: 30,
      failCallback,
    })) as Promise<void>)

    expect(fetcher).not.toHaveBeenCalled()
    expect(failCallback).toHaveBeenCalledOnce()

    await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    const secondBlock = await getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })

    expect(fetcher).toHaveBeenNthCalledWith(2, {
      mode: 'infinite',
      pageSize: 15,
      cursor: 'cursor-1',
    })
    expect(secondBlock.lastRow).toBe(30)
  })

  it('continues sequential infinite fetches when the previous cursor is undefined', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: createRows('block-1', 15), cursor: undefined, hasMore: true })
      .mockResolvedValueOnce({ data: createRows('block-2', 15), hasMore: false })
    const { datasource } = createInfiniteFetch(fetcher)
    const activeDatasource = expectDatasource(datasource.value)

    await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    await getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })

    expect(fetcher).toHaveBeenNthCalledWith(2, {
      mode: 'infinite',
      pageSize: 15,
      cursor: undefined,
    })
  })

  it('tracks failures and calls AG Grid failCallback', async () => {
    const thrownError = new Error('failed')
    const fetcher = vi.fn().mockRejectedValue(thrownError)
    const { datasource, error, isFetching } = createInfiniteFetch(fetcher)
    const activeDatasource = expectDatasource(datasource.value)
    const failCallback = vi.fn()

    await (activeDatasource.getRows(createGetRowsParams({
      startRow: 0,
      endRow: 15,
      failCallback,
    })) as Promise<void>)

    expect(failCallback).toHaveBeenCalledOnce()
    expect(error.value).toBe(thrownError)
    expect(isFetching.value).toBe(false)
  })

  it('ignores stale datasource results after resetKey changes', async () => {
    const staleRequest = createDeferred<{ data: TestRow[], cursor: string, hasMore: boolean }>()
    const latestRequest = createDeferred<{ data: TestRow[], cursor: string, hasMore: boolean }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(latestRequest.promise)
    const { data, datasource, error, isFetching, resetKey } = createInfiniteFetch(fetcher)
    const staleDatasource = expectDatasource(datasource.value)
    const staleSuccessCallback = vi.fn()
    const staleFailCallback = vi.fn()
    const staleGetRows = staleDatasource.getRows(createGetRowsParams({
      startRow: 0,
      endRow: 15,
      successCallback: staleSuccessCallback,
      failCallback: staleFailCallback,
    })) as Promise<void>

    resetKey.value += 1
    await nextTick()

    const latestDatasource = expectDatasource(datasource.value)
    const latestRows = getDatasourceRows(latestDatasource, { startRow: 0, endRow: 15 })

    staleRequest.resolve({
      data: createRows('stale-block', 15),
      cursor: 'stale-cursor',
      hasMore: true,
    })
    await staleGetRows

    expect(staleSuccessCallback).not.toHaveBeenCalled()
    // The stale request's data must never reach the grid — but AG Grid still
    // needs a definitive completion signal for it (failCallback), or its own
    // block-loader tracking treats this block index as permanently "in
    // flight" and silently refuses to schedule a later request for the same
    // index, even against the new (latest) datasource.
    expect(staleFailCallback).toHaveBeenCalledOnce()
    expect(data.value).toBeUndefined()
    expect(error.value).toBeUndefined()
    expect(isFetching.value).toBe(true)

    latestRequest.resolve({
      data: createRows('latest-block', 15),
      cursor: 'latest-cursor',
      hasMore: false,
    })
    const latestBlock = await latestRows

    expect(latestBlock.rows).toEqual(createRows('latest-block', 15))
    expect(data.value).toEqual(createRows('latest-block', 15))
    expect(isFetching.value).toBe(false)
  })

  it('forwards the current sort to the fetcher for the life of a datasource generation', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: [{ id: 'one' }], cursor: 'cursor-1', hasMore: true })
      .mockResolvedValueOnce({ data: [{ id: 'two' }], hasMore: false })
    const sort = ref<TableDataGridSort | undefined>({ sortColumnKey: 'id', sortColumnOrder: 'asc' })
    const { datasource } = createInfiniteFetch(fetcher, sort)
    const activeDatasource = expectDatasource(datasource.value)

    await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 100 })
    await getDatasourceRows(activeDatasource, { startRow: 100, endRow: 200 })

    expect(fetcher).toHaveBeenNthCalledWith(1, {
      mode: 'infinite',
      pageSize: 100,
      cursor: undefined,
      sort: { sortColumnKey: 'id', sortColumnOrder: 'asc' },
    })
    expect(fetcher).toHaveBeenNthCalledWith(2, {
      mode: 'infinite',
      pageSize: 100,
      cursor: 'cursor-1',
      sort: { sortColumnKey: 'id', sortColumnOrder: 'asc' },
    })
  })

  // Regression test for a reviewer-flagged race: a sort change must rebuild
  // the datasource (a new generation with cleared cursorMap/blockCompletionMap)
  // rather than reusing the same datasource with a different sort, because a
  // cursor is only valid relative to the sort that produced it. This proves a
  // delayed pre-sort request can never contribute a stale cursor to the new
  // sort's block chain, and that the new generation's block 1 always waits
  // for (and uses) its own generation's block 0 cursor.
  it('rebuilds the datasource on a sort change and never lets a delayed pre-sort request contribute a stale cursor', async () => {
    const preSortRequest = createDeferred<{ data: TestRow[], cursor: string, hasMore: boolean }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(preSortRequest.promise)
      .mockResolvedValueOnce({ data: createRows('sorted-block-0', 15), cursor: 'sorted-cursor-0', hasMore: true })
      .mockResolvedValueOnce({ data: createRows('sorted-block-1', 15), hasMore: false })
    const { datasource, resetKey } = createInfiniteFetch(fetcher)
    const preSortDatasource = expectDatasource(datasource.value)
    const preSortSuccessCallback = vi.fn()
    const preSortFailCallback = vi.fn()

    // AG Grid requested block 0 under the previous sort; this request is
    // still in flight when the sort changes.
    const preSortGetRows = preSortDatasource.getRows(createGetRowsParams({
      startRow: 0,
      endRow: 15,
      successCallback: preSortSuccessCallback,
      failCallback: preSortFailCallback,
    })) as Promise<void>

    // Simulate a sort change: TableDataGrid.vue includes the resolved sort
    // in resetKey, so this is the same rebuild path a sort change triggers.
    resetKey.value += 1
    await nextTick()

    const sortedDatasource = expectDatasource(datasource.value)
    expect(sortedDatasource).not.toBe(preSortDatasource)

    // The new generation's block 0 and block 1, in order, using only cursors
    // produced by this generation.
    const sortedBlock0 = await getDatasourceRows(sortedDatasource, { startRow: 0, endRow: 15 })
    const sortedBlock1 = await getDatasourceRows(sortedDatasource, { startRow: 15, endRow: 30 })

    expect(fetcher).toHaveBeenNthCalledWith(2, { mode: 'infinite', pageSize: 15, cursor: undefined, sort: undefined })
    expect(fetcher).toHaveBeenNthCalledWith(3, { mode: 'infinite', pageSize: 15, cursor: 'sorted-cursor-0', sort: undefined })
    expect(sortedBlock0.rows).toEqual(createRows('sorted-block-0', 15))
    expect(sortedBlock1.rows).toEqual(createRows('sorted-block-1', 15))

    // The delayed pre-sort request finally resolves — its data must be
    // fully inert: no success callback, and no contribution to the new
    // generation's block chain (already proven above, since block 1 used
    // 'sorted-cursor-0', not anything from this request). It still gets a
    // failCallback, though — AG Grid's own block-loader tracks this specific
    // load by block index, and never hearing back (success or fail) would
    // leave that index permanently marked "in flight", silently blocking
    // any later request for the same index against a future datasource.
    preSortRequest.resolve({ data: createRows('stale-block-0', 15), cursor: 'stale-cursor-0', hasMore: true })
    await preSortGetRows

    expect(preSortSuccessCallback).not.toHaveBeenCalled()
    expect(preSortFailCallback).toHaveBeenCalledOnce()
  })

  // Regression test: block 0 always bypasses the staleness check in
  // waitForPreviousBlockCompletion, so a stale generation's datasource object
  // can still be asked for block 0 well after a newer generation exists and
  // has already returned to idle. That start must not flip isFetching back
  // on, since its own completion is guaranteed to skip the matching decrement
  // (it isn't the latest generation) and would otherwise leave isFetching
  // stuck true forever.
  it('does not resurrect isFetching for a stale generation\'s orphaned block-0 request', async () => {
    const orphanRequest = createDeferred<{ data: TestRow[], cursor: string, hasMore: boolean }>()
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ data: createRows('latest-block', 15), cursor: 'latest-cursor', hasMore: false })
      .mockReturnValueOnce(orphanRequest.promise)
    const { datasource, isFetching, resetKey } = createInfiniteFetch(fetcher)
    const staleDatasource = expectDatasource(datasource.value)

    resetKey.value += 1
    await nextTick()

    const latestDatasource = expectDatasource(datasource.value)
    expect(latestDatasource).not.toBe(staleDatasource)

    // The latest generation does its own, unrelated fetch and returns to idle.
    await getDatasourceRows(latestDatasource, { startRow: 0, endRow: 15 })
    expect(isFetching.value).toBe(false)

    // AG Grid can still call getRows on the superseded datasource object.
    const orphanFailCallback = vi.fn()
    const orphanGetRows = staleDatasource.getRows(createGetRowsParams({
      startRow: 0,
      endRow: 15,
      failCallback: orphanFailCallback,
    })) as Promise<void>

    await nextTick()
    expect(isFetching.value).toBe(false)

    orphanRequest.resolve({ data: createRows('orphan-block', 15), cursor: 'orphan-cursor', hasMore: true })
    await orphanGetRows

    expect(orphanFailCallback).toHaveBeenCalledOnce()
    expect(isFetching.value).toBe(false)
  })
})
