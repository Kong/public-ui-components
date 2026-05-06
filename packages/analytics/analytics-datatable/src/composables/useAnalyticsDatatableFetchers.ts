import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableFetcher,
  AnalyticsDatatableFetcherParams,
} from '../types'
import type { IDatasource } from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, ref, shallowRef } from 'vue'

type RefreshOptions = {
  pageSize?: number
  sort?: AnalyticsDatatableConfig['sort']
}

type FetcherParamSources = {
  mode: Readonly<Ref<AnalyticsDatatableFetcherParams['mode']>>
  pageSize: Readonly<Ref<AnalyticsDatatableFetcherParams['pageSize']>>
  search: Readonly<Ref<AnalyticsDatatableFetcherParams['search']>>
  sort: Readonly<Ref<AnalyticsDatatableFetcherParams['sort']>>
  filterSelection: Readonly<Ref<AnalyticsDatatableFetcherParams['filterSelection']>>
}

export const useAnalyticsDatatableFetchers = <Row extends Record<string, any>>({
  fetcher,
  fetcherParams,
}: {
  fetcher: Readonly<Ref<AnalyticsDatatableFetcher<Row>>>
  fetcherParams: FetcherParamSources
}) => {
  const currentPage = ref(1)
  const cursorMap = new Map<number, any>()
  const datasource = ref<IDatasource>()
  const hasFetched = ref(false)
  const hasNextPageWhenTotalUnknown = ref(false)
  const pendingFetchCount = ref(0)
  const latestPaginationRequestId = ref(0)
  const rowData = shallowRef<Row[]>([])
  const totalRows = ref<number>()
  const isFetching = computed(() => pendingFetchCount.value > 0)

  const beginFetch = () => {
    pendingFetchCount.value += 1
  }

  const endFetch = () => {
    // Guards against an extra endFetch call after an interrupted or rejected request path.
    pendingFetchCount.value = Math.max(0, pendingFetchCount.value - 1)
    hasFetched.value = true
  }

  const resolveSort = (options: RefreshOptions): AnalyticsDatatableConfig['sort'] => (
    // Presence matters: { sort: undefined } intentionally clears the active sort.
    'sort' in options ? options.sort : fetcherParams.sort.value
  )

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
      const result = await fetcher.value({
        mode: 'pagination',
        page,
        pageSize: fetchPageSize,
        sort: resolveSort(options),
        search: fetcherParams.search.value,
        filterSelection: fetcherParams.filterSelection.value,
      })

      if (requestId !== latestPaginationRequestId.value || fetcherParams.mode.value !== 'pagination') {
        return
      }

      rowData.value = result.data
      totalRows.value = result.total
      hasNextPageWhenTotalUnknown.value = result.hasMore ?? (
        typeof result.total === 'number'
          ? page * fetchPageSize < result.total
          : result.data.length === fetchPageSize
      )
      currentPage.value = page
    } finally {
      endFetch()
    }
  }

  const buildInfiniteDatasource = (options: RefreshOptions = {}): IDatasource => {
    cursorMap.clear()
    rowData.value = []
    const datasourceSort = resolveSort(options)

    return {
      async getRows(params) {
        const size = params.endRow - params.startRow
        const blockIndex = Math.floor(params.startRow / size)
        const cursor = blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined

        beginFetch()
        try {
          const result = await fetcher.value({
            mode: 'infinite',
            page: undefined,
            pageSize: size,
            startRow: params.startRow,
            endRow: params.endRow,
            cursor,
            sort: datasourceSort,
            search: fetcherParams.search.value,
            filterSelection: fetcherParams.filterSelection.value,
          })

          if (result.cursor !== undefined) {
            cursorMap.set(blockIndex, result.cursor)
          }

          let lastRow = result.total
          if (lastRow === undefined && (result.hasMore === false || result.data.length < size)) {
            lastRow = params.startRow + result.data.length
          }

          params.successCallback(result.data, lastRow)
          if (params.startRow === 0) {
            rowData.value = result.data
          }
        } catch {
          params.failCallback()
        } finally {
          endFetch()
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
    hasFetched,
    hasNextPageWhenTotalUnknown,
    isFetching,
    refresh,
    rowData,
    totalRows,
  }
}
