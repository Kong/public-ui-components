import type {
  TableDataGridFetchModeSources,
} from '../types/internal'
import type { IDatasource } from 'ag-grid-community'
import { ref } from 'vue'
import type { RefreshOptions } from '../utils/fetchers'
import {
  getCursorBlock,
  resolveInfiniteLastRow,
  resolveInfiniteRequestSort,
  resolveRefreshSort,
} from '../utils/fetchers'

type BlockCompletion = {
  promise: Promise<boolean>
  resolve: (completed: boolean) => void
}

type InfiniteBlockGateResult = 'ready' | 'failed' | 'stale'

export const useTableDataGridInfiniteFetch = <Row extends Record<string, any>>({
  fetcher,
  params,
  state,
}: TableDataGridFetchModeSources<Row>) => {
  const cursorMap = new Map<number, unknown>()
  const blockCompletionMap = new Map<number, BlockCompletion>()
  const latestInfiniteDatasourceId = ref(0)

  const isLatestInfiniteDatasource = (datasourceId: number): boolean => (
    datasourceId === latestInfiniteDatasourceId.value && params.mode.value === 'infinite'
  )

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
    state.fetchError.value = undefined
    state.hasFetched.value = false
    state.rowData.value = []
    const datasourceSort = resolveRefreshSort({
      currentSort: {
        sortColumnKey: params.sortColumnKey.value,
        sortColumnOrder: params.sortColumnOrder.value,
      },
      options,
    })

    return {
      async getRows(getRowsParams) {
        const {
          blockIndex,
          pageSize,
        } = getCursorBlock({
          cursorMap,
          endRow: getRowsParams.endRow,
          startRow: getRowsParams.startRow,
        })

        const currentBlockCompletion = createBlockCompletion(blockIndex)
        const blockGateResult = await waitForPreviousBlockCompletion({
          blockIndex,
          currentBlockCompletion,
          datasourceId,
        })
        if (blockGateResult !== 'ready') {
          if (blockGateResult === 'failed') {
            getRowsParams.failCallback()
          }
          return
        }

        state.markFetchStarted()
        try {
          const cursor = blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined
          const requestSort = resolveInfiniteRequestSort({
            datasourceSort,
            sortModel: getRowsParams.sortModel,
          })
          const result = await fetcher.value({
            mode: 'infinite',
            page: undefined,
            pageSize,
            startRow: getRowsParams.startRow,
            endRow: getRowsParams.endRow,
            cursor,
            sortColumnKey: requestSort.sortColumnKey,
            sortColumnOrder: requestSort.sortColumnOrder,
            search: params.search.value,
            filterSelection: params.filterSelection.value,
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

          getRowsParams.successCallback(result.data, resolveInfiniteLastRow({
            result,
            pageSize,
            startRow: getRowsParams.startRow,
          }))
          if (getRowsParams.startRow === 0) {
            state.rowData.value = result.data
          }
          currentBlockCompletion.resolve(true)
        } catch (err) {
          if (!isLatestInfiniteDatasource(datasourceId)) {
            rejectBlockCompletion(blockIndex, currentBlockCompletion)
            return
          }
          state.fetchError.value = err
          getRowsParams.failCallback()
          rejectBlockCompletion(blockIndex, currentBlockCompletion)
        } finally {
          state.markFetchFinished({ markFetched: isLatestInfiniteDatasource(datasourceId) })
        }
      },
    }
  }

  const refreshInfinite = (options: RefreshOptions = {}) => {
    state.totalRows.value = undefined
    state.hasNextPageWhenTotalUnknown.value = false
    state.datasource.value = buildInfiniteDatasource(options)
  }

  return {
    refreshInfinite,
  }
}
