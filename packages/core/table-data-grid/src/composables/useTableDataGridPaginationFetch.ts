import type { TableDataGridFetcherResult } from '../types'
import type {
  TableDataGridFetchModeSources,
} from '../types/internal'
import { ref } from 'vue'
import type { RefreshOptions } from '../utils/fetchers'
import {
  resolveHasNextPageWhenTotalUnknown,
  resolveRefreshSort,
} from '../utils/fetchers'

export const useTableDataGridPaginationFetch = <Row extends Record<string, any>>({
  fetcher,
  params,
  state,
}: TableDataGridFetchModeSources<Row>) => {
  const latestPaginationRequestId = ref(0)

  const isLatestPaginationRequest = (requestId: number): boolean => (
    requestId === latestPaginationRequestId.value && params.mode.value === 'pagination'
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
    state.rowData.value = result.data
    state.totalRows.value = result.total
    state.hasNextPageWhenTotalUnknown.value = resolveHasNextPageWhenTotalUnknown({
      page,
      pageSize,
      result,
    })
    state.currentPage.value = page
  }

  const fetchPage = async (
    page: number,
    options: RefreshOptions = {},
  ) => {
    if (params.mode.value !== 'pagination') {
      return
    }

    const fetchPageSize = options.pageSize ?? params.pageSize.value
    const requestId = latestPaginationRequestId.value + 1
    latestPaginationRequestId.value = requestId
    state.markFetchStarted()
    try {
      const sort = resolveRefreshSort({
        currentSort: {
          sortColumnKey: params.sortColumnKey.value,
          sortColumnOrder: params.sortColumnOrder.value,
        },
        options,
      })
      const result = await fetcher.value({
        mode: 'pagination',
        page,
        pageSize: fetchPageSize,
        sortColumnKey: sort.sortColumnKey,
        sortColumnOrder: sort.sortColumnOrder,
        search: params.search.value,
        filterSelection: params.filterSelection.value,
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
        state.fetchError.value = err
        state.rowData.value = []
        state.totalRows.value = undefined
        state.hasNextPageWhenTotalUnknown.value = false
      }
    } finally {
      state.markFetchFinished({ markFetched: isLatestPaginationRequest(requestId) })
    }
  }

  const invalidatePaginationRequests = () => {
    latestPaginationRequestId.value += 1
  }

  return {
    fetchPage,
    invalidatePaginationRequests,
  }
}
