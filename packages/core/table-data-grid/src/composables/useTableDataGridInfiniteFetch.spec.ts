import type { TableDataGridFetcher } from '../types'
import type { IDatasource, IGetRowsParams } from 'ag-grid-community'
import { describe, expect, it, vi } from 'vitest'
import {
  createDeferred,
  createFetchHarness,
  createInfiniteFetchParams,
  createRows,
  type TestRow,
} from '../test-utils/tableDataGridFetch'
import { ref } from 'vue'
import { useTableDataGridInfiniteFetch } from './useTableDataGridInfiniteFetch'

const expectDatasource = (datasource: IDatasource | undefined): IDatasource => {
  expect(datasource).toBeDefined()

  return datasource as IDatasource
}

const createInfiniteFetch = (
  fetcher: TableDataGridFetcher<TestRow>,
) => {
  const harness = createFetchHarness({
    fetcher: ref(fetcher),
    params: createInfiniteFetchParams(),
  })
  const infiniteFetch = useTableDataGridInfiniteFetch<TestRow>(harness.sources)
  const refreshAndGetDatasource = () => {
    infiniteFetch.refreshInfinite()

    return expectDatasource(harness.datasource.value)
  }

  return {
    ...harness,
    ...infiniteFetch,
    refreshAndGetDatasource,
  }
}

const createGetRowsParams = ({
  endRow,
  startRow,
  failCallback = vi.fn(),
  sortModel = [],
  successCallback = vi.fn(),
}: {
  endRow: number
  startRow: number
  failCallback?: IGetRowsParams['failCallback']
  sortModel?: IGetRowsParams['sortModel']
  successCallback?: IGetRowsParams['successCallback']
}): IGetRowsParams => ({
  context: undefined,
  endRow,
  failCallback,
  filterModel: undefined,
  sortModel,
  startRow,
  successCallback,
})

const getDatasourceRows = async (
  datasource: IDatasource,
  { endRow, startRow }: { endRow: number, startRow: number },
): Promise<{ lastRow?: number, rows: TestRow[] }> => new Promise((resolve, reject) => {
  datasource.getRows(createGetRowsParams({
    endRow,
    failCallback: reject,
    startRow,
    successCallback: (rowsThisBlock, lastRow) => {
      resolve({
        lastRow,
        rows: rowsThisBlock as TestRow[],
      })
    },
  }))
})

const createPendingInfiniteBlocks = () => {
  const firstRequest = createDeferred<{
    data: TestRow[]
    cursor?: string
    hasMore: boolean
  }>()
  const secondRequest = createDeferred<{
    data: TestRow[]
    cursor?: string
    hasMore: boolean
  }>()
  const fetcher = vi.fn()
    .mockReturnValueOnce(firstRequest.promise)
    .mockReturnValueOnce(secondRequest.promise)
  const infiniteFetch = createInfiniteFetch(fetcher as TableDataGridFetcher<TestRow>)
  const activeDatasource = infiniteFetch.refreshAndGetDatasource()

  return {
    activeDatasource,
    fetcher,
    firstBlockPromise: getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 }),
    firstRequest,
    infiniteFetch,
    secondBlockPromise: getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 }),
    secondRequest,
  }
}

const requestOutOfOrderSecondBlock = async (
  fetcher: TableDataGridFetcher<TestRow>,
) => {
  const infiniteFetch = createInfiniteFetch(fetcher)
  const activeDatasource = infiniteFetch.refreshAndGetDatasource()
  const failCallback = vi.fn()

  await (activeDatasource.getRows(createGetRowsParams({
    endRow: 30,
    failCallback,
    startRow: 15,
  })) as Promise<void>)

  return {
    activeDatasource,
    failCallback,
    infiniteFetch,
  }
}

describe('useTableDataGridInfiniteFetch', () => {
  it('waits for the previous infinite block to complete before fetching the next block', async () => {
    const {
      fetcher,
      firstBlockPromise,
      firstRequest,
      secondBlockPromise,
      secondRequest,
    } = createPendingInfiniteBlocks()
    await Promise.resolve()

    expect(fetcher).toHaveBeenNthCalledWith(1, expect.objectContaining({
      cursor: undefined,
      pageSize: 15,
      startRow: 0,
    }))

    firstRequest.resolve({
      data: createRows('block-1', 15),
      cursor: 'cursor-1',
      hasMore: true,
    })
    const firstBlock = await firstBlockPromise
    await Promise.resolve()

    expect(fetcher).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: 'cursor-1',
      pageSize: 15,
      startRow: 15,
    }))

    secondRequest.resolve({
      data: createRows('block-2', 15),
      cursor: 'cursor-2',
      hasMore: false,
    })
    const secondBlock = await secondBlockPromise

    expect(firstBlock.lastRow).toBeUndefined()
    expect(secondBlock.lastRow).toBe(30)
  })

  it('uses the ag-grid infinite sort model for row requests', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      data: createRows('sorted-block', 15),
      cursor: 'cursor-1',
      hasMore: true,
    })
    const infiniteFetch = createInfiniteFetch(fetcher as TableDataGridFetcher<TestRow>)
    const activeDatasource = infiniteFetch.refreshAndGetDatasource()
    await (activeDatasource.getRows(createGetRowsParams({
      endRow: 15,
      sortModel: [{ colId: 'status', sort: 'desc' }],
      startRow: 0,
    })) as Promise<void>)

    expect(fetcher).toHaveBeenCalledWith(expect.objectContaining({
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    }))
  })

  it('fails a later infinite block when the prior block never completed', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      data: createRows('block-1', 15),
      cursor: 'cursor-1',
      hasMore: true,
    })
    const { failCallback } = await requestOutOfOrderSecondBlock(fetcher as TableDataGridFetcher<TestRow>)

    expect(fetcher).not.toHaveBeenCalled()
    expect(failCallback).toHaveBeenCalledOnce()
  })

  it('allows a failed out-of-order infinite block to be retried after the prior block completes', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({
        data: createRows('block-1', 15),
        cursor: 'cursor-1',
        hasMore: true,
      })
      .mockResolvedValueOnce({
        data: createRows('block-2', 15),
        cursor: 'cursor-2',
        hasMore: false,
      })
    const {
      activeDatasource,
      failCallback,
    } = await requestOutOfOrderSecondBlock(fetcher as TableDataGridFetcher<TestRow>)

    await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    await getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })

    expect(failCallback).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: 'cursor-1',
      startRow: 15,
    }))
  })

  it('continues sequential infinite fetches when the prior cursor is undefined', async () => {
    const {
      fetcher,
      firstBlockPromise,
      firstRequest,
      secondBlockPromise,
      secondRequest,
    } = createPendingInfiniteBlocks()
    await Promise.resolve()

    firstRequest.resolve({
      data: createRows('block-1', 15),
      cursor: undefined,
      hasMore: true,
    })
    await firstBlockPromise
    await Promise.resolve()

    expect(fetcher).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: undefined,
      pageSize: 15,
      startRow: 15,
    }))

    secondRequest.resolve({
      data: createRows('block-2', 15),
      cursor: 'cursor-2',
      hasMore: false,
    })
    const secondBlock = await secondBlockPromise

    expect(secondBlock.lastRow).toBe(30)
  })

  it('ignores stale infinite datasource results after a datasource refresh', async () => {
    const staleRequest = createDeferred<{
      data: TestRow[]
      cursor: string
      hasMore: boolean
    }>()
    const latestRequest = createDeferred<{
      data: TestRow[]
      cursor: string
      hasMore: boolean
    }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(staleRequest.promise)
      .mockReturnValueOnce(latestRequest.promise)
    const infiniteFetch = createInfiniteFetch(fetcher as TableDataGridFetcher<TestRow>)
    const staleDatasource = infiniteFetch.refreshAndGetDatasource()
    const staleSuccessCallback = vi.fn()
    const staleFailCallback = vi.fn()
    const staleGetRows = staleDatasource.getRows(createGetRowsParams({
      endRow: 15,
      failCallback: staleFailCallback,
      startRow: 0,
      successCallback: staleSuccessCallback,
    })) as unknown as Promise<void>

    const latestDatasource = infiniteFetch.refreshAndGetDatasource()
    const latestRows = getDatasourceRows(latestDatasource, { startRow: 0, endRow: 15 })

    staleRequest.resolve({
      data: createRows('stale-block', 15),
      cursor: 'stale-cursor',
      hasMore: true,
    })
    await staleGetRows

    expect(staleSuccessCallback).not.toHaveBeenCalled()
    expect(staleFailCallback).not.toHaveBeenCalled()
    expect(infiniteFetch.rowData.value).toEqual([])
    expect(infiniteFetch.isFetching.value).toBe(true)

    latestRequest.resolve({
      data: createRows('latest-block', 15),
      cursor: 'latest-cursor',
      hasMore: false,
    })
    const latestBlock = await latestRows

    expect(latestBlock.rows).toEqual(createRows('latest-block', 15))
    expect(infiniteFetch.rowData.value).toEqual(createRows('latest-block', 15))
    expect(infiniteFetch.isFetching.value).toBe(false)
  })

  it('resolves infinite last rows from total or short terminal blocks', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({
        data: createRows('known-total', 15),
        total: 42,
      })
      .mockResolvedValueOnce({
        data: createRows('short-block', 3),
        hasMore: true,
      })
      .mockResolvedValueOnce({
        data: createRows('terminal-short-block', 3),
      })
    const infiniteFetch = createInfiniteFetch(fetcher as TableDataGridFetcher<TestRow>)
    const activeDatasource = infiniteFetch.refreshAndGetDatasource()
    const knownTotalBlock = await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    const shortBlock = await getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })
    const terminalShortBlock = await getDatasourceRows(activeDatasource, { startRow: 30, endRow: 45 })

    expect(knownTotalBlock.lastRow).toBe(42)
    expect(shortBlock.lastRow).toBeUndefined()
    expect(terminalShortBlock.lastRow).toBe(33)
  })
})
