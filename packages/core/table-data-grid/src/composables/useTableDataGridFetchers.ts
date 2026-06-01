import type {
  TableDataGridConfig,
  TableDataGridFetcher,
  TableDataGridFetcherParams,
  TableDataGridFetcherResult,
} from '../types'
import type { IDatasource } from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, ref, shallowRef } from 'vue'

type RefreshOptions = {
  pageSize?: number
  sortColumnKey?: TableDataGridConfig['sortColumnKey']
  sortColumnOrder?: TableDataGridConfig['sortColumnOrder']
}

type FetcherParamSources = {
  mode: Readonly<Ref<TableDataGridFetcherParams['mode']>>
  pageSize: Readonly<Ref<TableDataGridFetcherParams['pageSize']>>
  search: Readonly<Ref<TableDataGridFetcherParams['search']>>
  sortColumnKey: Readonly<Ref<TableDataGridFetcherParams['sortColumnKey']>>
  sortColumnOrder: Readonly<Ref<TableDataGridFetcherParams['sortColumnOrder']>>
  filterSelection: Readonly<Ref<TableDataGridFetcherParams['filterSelection']>>
}

type BlockCompletion = {
  promise: Promise<boolean>
  resolve: (completed: boolean) => void
}

type InfiniteSortModelItem = {
  colId?: string
  sort?: string
}

type InfiniteBlockGateResult = 'ready' | 'failed' | 'stale'

export const useTableDataGridFetchers = <Row extends Record<string, any>>({
  fetcher,
  fetcherParams,
}: {
  fetcher: Readonly<Ref<TableDataGridFetcher<Row>>>
  fetcherParams: FetcherParamSources
}) => {
  const currentPage = ref(1)
  const cursorMap = new Map<number, any>()
  const blockCompletionMap = new Map<number, BlockCompletion>()
  const datasource = ref<IDatasource>()
  const hasFetched = ref(false)
  const hasNextPageWhenTotalUnknown = ref(false)
  const pendingFetchCount = ref(0)
  const fetchError = ref<unknown>()
  const latestInfiniteDatasourceId = ref(0)
  const latestPaginationRequestId = ref(0)
  const rowData = shallowRef<Row[]>([])
  const totalRows = ref<number>()
  const isFetching = computed(() => pendingFetchCount.value > 0)

  const beginFetch = () => {
    fetchError.value = undefined
    pendingFetchCount.value += 1
  }

  const endFetch = ({ markFetched = true }: { markFetched?: boolean } = {}) => {
    // Guards against an extra endFetch call after an interrupted or rejected request path.
    pendingFetchCount.value = Math.max(0, pendingFetchCount.value - 1)
    if (markFetched) {
      hasFetched.value = true
    }
  }

  const resolveSort = (options: RefreshOptions) => ({
    // Presence matters: { sortColumnKey: undefined } intentionally clears the active sort.
    sortColumnKey: 'sortColumnKey' in options ? options.sortColumnKey : fetcherParams.sortColumnKey.value,
    sortColumnOrder: 'sortColumnOrder' in options ? options.sortColumnOrder : fetcherParams.sortColumnOrder.value,
  })

  const resolveInfiniteRequestSort = ({
    datasourceSort,
    sortModel,
  }: {
    datasourceSort: ReturnType<typeof resolveSort>
    sortModel?: InfiniteSortModelItem[]
  }): Pick<TableDataGridFetcherParams, 'sortColumnKey' | 'sortColumnOrder'> => {
    const [activeSort] = sortModel ?? []
    if (activeSort?.colId && (activeSort.sort === 'asc' || activeSort.sort === 'desc')) {
      return {
        sortColumnKey: activeSort.colId,
        sortColumnOrder: activeSort.sort,
      }
    }

    return datasourceSort
  }

  const isLatestPaginationRequest = (requestId: number): boolean => (
    requestId === latestPaginationRequestId.value && fetcherParams.mode.value === 'pagination'
  )

  const isLatestInfiniteDatasource = (datasourceId: number): boolean => (
    datasourceId === latestInfiniteDatasourceId.value && fetcherParams.mode.value === 'infinite'
  )

  const resolveHasNextPageWhenTotalUnknown = ({
    page,
    pageSize,
    result,
  }: {
    page: number
    pageSize: number
    result: TableDataGridFetcherResult<Row>
  }): boolean => result.hasMore ?? (
    typeof result.total === 'number'
      ? page * pageSize < result.total
      : result.data.length === pageSize
  )

  const commitPaginationResult = ({
    page,
    pageSize,
    result,
  }: {
    page: number
    pageSize: number
    result: TableDataGridFetcherResult<Row>
  }) => {
    rowData.value = result.data
    totalRows.value = result.total
    hasNextPageWhenTotalUnknown.value = resolveHasNextPageWhenTotalUnknown({
      page,
      pageSize,
      result,
    })
    currentPage.value = page
  }

  const fetchPage = async (
    page: number,
    options: RefreshOptions = {},
  ) => {
    if (fetcherParams.mode.value !== 'pagination') {
      return
    }

    const fetchPageSize = options.pageSize ?? fetcherParams.pageSize.value
    const requestId = latestPaginationRequestId.value + 1
    latestPaginationRequestId.value = requestId
    beginFetch()
    try {
      const sort = resolveSort(options)
      const result = await fetcher.value({
        mode: 'pagination',
        page,
        pageSize: fetchPageSize,
        sortColumnKey: sort.sortColumnKey,
        sortColumnOrder: sort.sortColumnOrder,
        search: fetcherParams.search.value,
        filterSelection: fetcherParams.filterSelection.value,
      })

      if (!isLatestPaginationRequest(requestId)) {
        return
      }

      commitPaginationResult({
        page,
        pageSize: fetchPageSize,
        result,
      })
    } catch (err) {
      if (isLatestPaginationRequest(requestId)) {
        fetchError.value = err
        rowData.value = []
        totalRows.value = undefined
        hasNextPageWhenTotalUnknown.value = false
      }
    } finally {
      endFetch({ markFetched: isLatestPaginationRequest(requestId) })
    }
  }

  const getCursorBlock = ({
    endRow,
    startRow,
  }: {
    endRow: number
    startRow: number
  }) => {
    const pageSize = endRow - startRow
    const blockIndex = Math.floor(startRow / pageSize)

    return {
      blockIndex,
      cursor: blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined,
      pageSize,
    }
  }

  const resolveInfiniteLastRow = ({
    result,
    pageSize,
    startRow,
  }: {
    result: TableDataGridFetcherResult<Row>
    pageSize: number
    startRow: number
  }): number | undefined => {
    if (typeof result.total === 'number') {
      return result.total
    }

    if (result.hasMore === true) {
      return undefined
    }

    if (result.hasMore === false || result.data.length < pageSize) {
      return startRow + result.data.length
    }

    return undefined
  }

  const createBlockCompletion = (blockIndex: number): BlockCompletion => {
    const existingCompletion = blockCompletionMap.get(blockIndex)
    if (existingCompletion) {
      return existingCompletion
    }

    let resolveCurrentBlock!: (completed: boolean) => void
    const completion: BlockCompletion = {
      promise: new Promise<boolean>((resolve) => {
        resolveCurrentBlock = resolve
      }),
      resolve: completed => resolveCurrentBlock(completed),
    }

    blockCompletionMap.set(blockIndex, completion)

    return completion
  }

  const rejectBlockCompletion = (blockIndex: number, completion: BlockCompletion) => {
    completion.resolve(false)
    if (blockCompletionMap.get(blockIndex) === completion) {
      blockCompletionMap.delete(blockIndex)
    }
  }

  const waitForPreviousBlockCompletion = async ({
    blockIndex,
    currentBlockCompletion,
    datasourceId,
  }: {
    blockIndex: number
    currentBlockCompletion: BlockCompletion
    datasourceId: number
  }): Promise<InfiniteBlockGateResult> => {
    if (blockIndex === 0) {
      return 'ready'
    }

    const previousBlockCompletion = blockCompletionMap.get(blockIndex - 1)
    if (!previousBlockCompletion) {
      rejectBlockCompletion(blockIndex, currentBlockCompletion)
      return 'failed'
    }

    const previousBlockCompleted = await previousBlockCompletion.promise

    // AG Grid can let block requests from a previous datasource resolve after
    // a sort/filter/mode refresh has swapped in a new datasource.
    if (!isLatestInfiniteDatasource(datasourceId)) {
      rejectBlockCompletion(blockIndex, currentBlockCompletion)
      return 'stale'
    }

    if (!previousBlockCompleted) {
      rejectBlockCompletion(blockIndex, currentBlockCompletion)
      return 'failed'
    }

    return 'ready'
  }

  const buildInfiniteDatasource = (options: RefreshOptions = {}): IDatasource => {
    const datasourceId = latestInfiniteDatasourceId.value + 1
    latestInfiniteDatasourceId.value = datasourceId
    cursorMap.clear()
    blockCompletionMap.clear()
    fetchError.value = undefined
    hasFetched.value = false
    rowData.value = []
    const datasourceSort = resolveSort(options)

    return {
      async getRows(params) {
        const {
          blockIndex,
          pageSize,
        } = getCursorBlock({
          endRow: params.endRow,
          startRow: params.startRow,
        })

        const currentBlockCompletion = createBlockCompletion(blockIndex)
        const blockGateResult = await waitForPreviousBlockCompletion({
          blockIndex,
          currentBlockCompletion,
          datasourceId,
        })
        if (blockGateResult !== 'ready') {
          if (blockGateResult === 'failed') {
            params.failCallback()
          }
          return
        }

        beginFetch()
        try {
          const cursor = blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined
          const requestSort = resolveInfiniteRequestSort({
            datasourceSort,
            sortModel: params.sortModel,
          })
          const result = await fetcher.value({
            mode: 'infinite',
            page: undefined,
            pageSize,
            startRow: params.startRow,
            endRow: params.endRow,
            cursor,
            sortColumnKey: requestSort.sortColumnKey,
            sortColumnOrder: requestSort.sortColumnOrder,
            search: fetcherParams.search.value,
            filterSelection: fetcherParams.filterSelection.value,
          })

          // AG Grid can let block requests from a previous datasource resolve after
          // a sort/filter/mode refresh has swapped in a new datasource.
          if (!isLatestInfiniteDatasource(datasourceId)) {
            rejectBlockCompletion(blockIndex, currentBlockCompletion)
            return
          }

          if (result.cursor !== undefined) {
            cursorMap.set(blockIndex, result.cursor)
          }

          params.successCallback(result.data, resolveInfiniteLastRow({
            result,
            pageSize,
            startRow: params.startRow,
          }))
          if (params.startRow === 0) {
            rowData.value = result.data
          }
          currentBlockCompletion.resolve(true)
        } catch (err) {
          if (!isLatestInfiniteDatasource(datasourceId)) {
            rejectBlockCompletion(blockIndex, currentBlockCompletion)
            return
          }
          fetchError.value = err
          params.failCallback()
          rejectBlockCompletion(blockIndex, currentBlockCompletion)
        } finally {
          endFetch({ markFetched: isLatestInfiniteDatasource(datasourceId) })
        }
      },
    }
  }

  const refresh = (options: RefreshOptions = {}) => {
    if (fetcherParams.mode.value === 'pagination') {
      datasource.value = undefined
      void fetchPage(1, options)
      return
    }

    // Invalidates any in-flight pagination request before swapping to a datasource.
    latestPaginationRequestId.value += 1
    totalRows.value = undefined
    hasNextPageWhenTotalUnknown.value = false
    datasource.value = buildInfiniteDatasource(options)
  }

  return {
    currentPage,
    datasource,
    fetchPage,
    fetchError,
    hasFetched,
    hasNextPageWhenTotalUnknown,
    isFetching,
    refresh,
    rowData,
    totalRows,
  }
}
