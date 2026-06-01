import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { IDatasource, IGetRowsParams } from 'ag-grid-community'
import type { TableDataGridFetcher } from '../types'
import { useTableDataGridFetchers } from './useTableDataGridFetchers'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useTableDataGridFetchers', () => {
  const createPaginationFetcherParamSources = () => ({
    mode: computed(() => 'pagination' as const),
    pageSize: computed(() => 15),
    search: computed(() => undefined),
    sortColumnKey: computed(() => undefined),
    sortColumnOrder: computed(() => undefined),
    filterSelection: computed(() => undefined),
  })

  const createInfiniteFetcherParamSources = () => ({
    mode: computed(() => 'infinite' as const),
    pageSize: computed(() => 15),
    search: computed(() => undefined),
    sortColumnKey: computed(() => undefined),
    sortColumnOrder: computed(() => undefined),
    filterSelection: computed(() => undefined),
  })

  const createRows = (prefix: string, length: number): TestRow[] => (
    Array.from({ length }, (_, index) => ({
      id: `${prefix}-${index + 1}`,
      name: `${prefix} ${index + 1}`,
      status: 200,
    }))
  )

  const createDeferred = <Value>() => {
    let deferredResolve!: (value: Value) => void
    const promise = new Promise<Value>((resolve) => {
      deferredResolve = resolve
    })

    return { promise, resolve: deferredResolve }
  }

  const getDatasourceRows = async (
    datasource: IDatasource,
    { endRow, startRow }: { endRow: number, startRow: number },
  ): Promise<{ lastRow?: number, rows: TestRow[] }> => new Promise((resolve, reject) => {
    const params: IGetRowsParams = {
      context: undefined,
      endRow,
      failCallback: reject,
      filterModel: undefined,
      sortModel: [],
      startRow,
      successCallback: (rowsThisBlock, lastRow) => {
        resolve({
          lastRow,
          rows: rowsThisBlock as TestRow[],
        })
      },
    }

    datasource.getRows(params)
  })

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

  const expectDatasource = (datasource: IDatasource | undefined): IDatasource => {
    expect(datasource).toBeDefined()

    return datasource as IDatasource
  }

  it('only commits the latest pagination request result', async () => {
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
    const {
      currentPage,
      fetchPage,
      rowData,
      totalRows,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createPaginationFetcherParamSources(),
    })

    const firstFetch = fetchPage(1)
    const secondFetch = fetchPage(2)
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

    expect(rowData.value).toEqual([{ id: 'row-2', name: 'Second', status: 200 }])
    expect(totalRows.value).toBe(2)
    expect(currentPage.value).toBe(2)
  })

  it('does not mark stale pagination requests as fetched', async () => {
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
    const {
      fetchPage,
      hasFetched,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createPaginationFetcherParamSources(),
    })

    const firstFetch = fetchPage(1)
    const secondFetch = fetchPage(2)
    firstRequest.resolve({
      data: [{ id: 'row-1', name: 'First', status: 200 }],
      total: 2,
    })
    await firstFetch
    expect(hasFetched.value).toBe(false)

    secondRequest.resolve({
      data: [{ id: 'row-2', name: 'Second', status: 200 }],
      total: 2,
    })
    await secondFetch

    expect(hasFetched.value).toBe(true)
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
    const {
      fetchPage,
      rowData,
    } = useTableDataGridFetchers<TestRow>({
      fetcher,
      fetcherParams: createPaginationFetcherParamSources(),
    })

    fetcher.value = latestFetcher
    await fetchPage(1)

    expect(initialFetcher).not.toHaveBeenCalled()
    expect(latestFetcher).toHaveBeenCalledOnce()
    expect(rowData.value).toEqual([{ id: 'row-2', name: 'Latest', status: 200 }])
  })

  it('uses hasMore when total rows are omitted instead of inferring only from page size', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      data: createRows('row', 15),
      hasMore: false,
    }).mockResolvedValueOnce({
      data: createRows('short-row', 1),
      hasMore: true,
    })
    const {
      fetchPage,
      hasNextPageWhenTotalUnknown,
      totalRows,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createPaginationFetcherParamSources(),
    })

    await fetchPage(1)
    expect(hasNextPageWhenTotalUnknown.value).toBe(true)

    await fetchPage(2)
    expect(hasNextPageWhenTotalUnknown.value).toBe(false)
    expect(totalRows.value).toBeUndefined()
  })

  it('infers unknown-total next-page state from returned page size when hasMore is omitted', async () => {
    const fullPageFetcher = vi.fn().mockResolvedValue({
      data: createRows('full-row', 15),
    })
    const partialPageFetcher = vi.fn().mockResolvedValue({
      data: [{ id: 'partial-row-1', name: 'Partial row 1', status: 200 }],
    })
    const fetcher = ref<TableDataGridFetcher<TestRow>>(fullPageFetcher)
    const {
      fetchPage,
      hasNextPageWhenTotalUnknown,
    } = useTableDataGridFetchers<TestRow>({
      fetcher,
      fetcherParams: createPaginationFetcherParamSources(),
    })

    await fetchPage(1)
    expect(hasNextPageWhenTotalUnknown.value).toBe(true)

    fetcher.value = partialPageFetcher
    await fetchPage(2)
    expect(hasNextPageWhenTotalUnknown.value).toBe(false)
  })

  it('waits for the previous infinite block to complete before fetching the next block', async () => {
    const firstRequest = createDeferred<{
      data: TestRow[]
      cursor: string
      hasMore: boolean
    }>()
    const secondRequest = createDeferred<{
      data: TestRow[]
      cursor: string
      hasMore: boolean
    }>()
    const fetcher = vi.fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise)
    const {
      datasource,
      refresh,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()

    const activeDatasource = expectDatasource(datasource.value)
    const firstBlockPromise = getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    const secondBlockPromise = getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })
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
    const {
      datasource,
      refresh,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()

    const activeDatasource = expectDatasource(datasource.value)
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
    const {
      datasource,
      refresh,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()

    const activeDatasource = expectDatasource(datasource.value)
    const failCallback = vi.fn()
    await (activeDatasource.getRows(createGetRowsParams({
      endRow: 30,
      failCallback,
      startRow: 15,
    })) as Promise<void>)

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
      datasource,
      refresh,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()

    const activeDatasource = expectDatasource(datasource.value)
    const failCallback = vi.fn()
    await (activeDatasource.getRows(createGetRowsParams({
      endRow: 30,
      failCallback,
      startRow: 15,
    })) as Promise<void>)

    await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    await getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })

    expect(failCallback).toHaveBeenCalledOnce()
    expect(fetcher).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: 'cursor-1',
      startRow: 15,
    }))
  })

  it('continues sequential infinite fetches when the prior cursor is undefined', async () => {
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
    const {
      datasource,
      refresh,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()

    const activeDatasource = expectDatasource(datasource.value)
    const firstBlockPromise = getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    const secondBlockPromise = getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })
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
    const {
      datasource,
      isFetching,
      refresh,
      rowData,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()
    const staleDatasource = expectDatasource(datasource.value)
    const staleSuccessCallback = vi.fn()
    const staleFailCallback = vi.fn()
    const staleGetRows = staleDatasource.getRows(createGetRowsParams({
      endRow: 15,
      failCallback: staleFailCallback,
      startRow: 0,
      successCallback: staleSuccessCallback,
    })) as unknown as Promise<void>

    refresh()
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
    expect(rowData.value).toEqual([])
    expect(isFetching.value).toBe(true)

    latestRequest.resolve({
      data: createRows('latest-block', 15),
      cursor: 'latest-cursor',
      hasMore: false,
    })
    const latestBlock = await latestRows

    expect(latestBlock.rows).toEqual(createRows('latest-block', 15))
    expect(rowData.value).toEqual(createRows('latest-block', 15))
    expect(isFetching.value).toBe(false)
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
    const {
      datasource,
      refresh,
    } = useTableDataGridFetchers<TestRow>({
      fetcher: ref(fetcher as TableDataGridFetcher<TestRow>),
      fetcherParams: createInfiniteFetcherParamSources(),
    })

    refresh()

    const activeDatasource = expectDatasource(datasource.value)
    const knownTotalBlock = await getDatasourceRows(activeDatasource, { startRow: 0, endRow: 15 })
    const shortBlock = await getDatasourceRows(activeDatasource, { startRow: 15, endRow: 30 })
    const terminalShortBlock = await getDatasourceRows(activeDatasource, { startRow: 30, endRow: 45 })

    expect(knownTotalBlock.lastRow).toBe(42)
    expect(shortBlock.lastRow).toBeUndefined()
    expect(terminalShortBlock.lastRow).toBe(33)
  })
})
