import type { TableDataGridFetcher } from '../types'
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

const createInfiniteFetch = (fetcher: TableDataGridFetcher<TestRow>) => {
  const resetKey = ref(0)
  const infiniteFetch = useFetchInfinite({
    fetcher,
    resetKey,
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
    expect(staleFailCallback).not.toHaveBeenCalled()
    expect(data.value).toEqual([])
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
})
