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

export const useTableDataGridFetchers = <Row extends Record<string, any>>({
  fetcher,
  fetcherParams,
}: {
  fetcher: Readonly<Ref<TableDataGridFetcher<Row>>>
  fetcherParams: FetcherParamSources
}) => {
  const currentPage = ref(1)
  const cursorMap = new Map<number, any>()
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
      endFetch()
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

    if (result.hasMore === false || result.data.length < pageSize) {
      return startRow + result.data.length
    }

    return undefined
  }

  const buildInfiniteDatasource = (options: RefreshOptions = {}): IDatasource => {
    const datasourceId = latestInfiniteDatasourceId.value + 1
    latestInfiniteDatasourceId.value = datasourceId
    cursorMap.clear()
    fetchError.value = undefined
    hasFetched.value = false
    rowData.value = []
    const datasourceSort = resolveSort(options)

    return {
      async getRows(params) {
        const {
          blockIndex,
          cursor,
          pageSize,
        } = getCursorBlock({
          endRow: params.endRow,
          startRow: params.startRow,
        })

        beginFetch()
        try {
          const result = await fetcher.value({
            mode: 'infinite',
            page: undefined,
            pageSize,
            startRow: params.startRow,
            endRow: params.endRow,
            cursor,
            sortColumnKey: datasourceSort.sortColumnKey,
            sortColumnOrder: datasourceSort.sortColumnOrder,
            search: fetcherParams.search.value,
            filterSelection: fetcherParams.filterSelection.value,
          })

          // AG Grid can let block requests from a previous datasource resolve after
          // a sort/filter/mode refresh has swapped in a new datasource.
          if (!isLatestInfiniteDatasource(datasourceId)) {
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
        } catch (err) {
          if (!isLatestInfiniteDatasource(datasourceId)) {
            return
          }
          fetchError.value = err
          params.failCallback()
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
