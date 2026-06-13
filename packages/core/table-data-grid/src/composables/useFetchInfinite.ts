import type {
  TableDataGridFetcher,
  TableDataGridFetcherResult,
  TableDataGridRow,
} from '../types'
import type { IDatasource, IGetRowsParams } from 'ag-grid-community'
import type { Ref } from 'vue'
import { readonly, ref, shallowRef, watch } from 'vue'
import { getCursorBlock, resolveInfiniteLastRow } from '../utils/fetchers'

type BlockCompletion = {
  promise: Promise<boolean>
  resolve: (completed: boolean) => void
}

type InfiniteBlockGateResult = 'ready' | 'failed' | 'stale'

interface UseFetchInfiniteOptions<Row extends object = TableDataGridRow> {
  /**
   * Public row fetcher supplied by the host. The composable keeps AG Grid row
   * ranges internal and calls this with the cursor-first TableDataGrid contract.
   */
  fetcher: TableDataGridFetcher<Row>
  /**
   * Reactive invalidation input from the component layer. Any change rebuilds
   * the datasource and clears cursor/block state back to block 0.
   */
  resetKey?: Readonly<Ref<unknown>>
}

/**
 * Owns AG Grid infinite datasource creation and cursor-backed fetch
 * orchestration for TableDataGrid.
 *
 * Callers provide the public fetcher and an optional reset key, then observe
 * readonly fetch state and pass the returned datasource to AG Grid. Cursor maps,
 * block completion gates, pending counts, and stale datasource guards stay
 * private to this composable so component code cannot mutate fetch lifecycle
 * state directly.
 */
export const useFetchInfinite = <Row extends object = TableDataGridRow>({
  fetcher,
  resetKey,
}: UseFetchInfiniteOptions<Row>) => {
  const cursorMap = new Map<number, unknown>()
  const blockCompletionMap = new Map<number, BlockCompletion>()
  const latestDatasourceId = ref(0)
  const datasource = shallowRef<IDatasource>()
  const data = shallowRef<Row[] | undefined>()
  const error = shallowRef<unknown>()
  const pendingFetchCount = ref(0)
  const isFetching = ref(false)

  const isLatestDatasource = (datasourceId: number): boolean => (
    datasourceId === latestDatasourceId.value
  )

  const syncIsFetching = () => {
    isFetching.value = pendingFetchCount.value > 0
  }

  const markFetchStarted = () => {
    error.value = undefined
    pendingFetchCount.value += 1
    syncIsFetching()
  }

  const markFetchFinished = () => {
    pendingFetchCount.value = Math.max(0, pendingFetchCount.value - 1)
    syncIsFetching()
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
    // Cursor-backed blocks are sequential even if AG Grid requests them
    // concurrently. A later block can only fetch after the previous block has
    // either produced the cursor it needs or failed.
    if (blockIndex === 0) {
      return 'ready'
    }

    const previousBlockCompletion = blockCompletionMap.get(blockIndex - 1)
    if (!previousBlockCompletion) {
      rejectBlockCompletion(blockIndex, currentBlockCompletion)
      return 'failed'
    }

    const previousBlockCompleted = await previousBlockCompletion.promise
    if (!isLatestDatasource(datasourceId)) {
      rejectBlockCompletion(blockIndex, currentBlockCompletion)
      return 'stale'
    }

    if (!previousBlockCompleted) {
      rejectBlockCompletion(blockIndex, currentBlockCompletion)
      return 'failed'
    }

    return 'ready'
  }

  const handleSuccessfulBlock = ({
    blockIndex,
    currentBlockCompletion,
    getRowsParams,
    pageSize,
    result,
  }: {
    blockIndex: number
    currentBlockCompletion: BlockCompletion
    getRowsParams: IGetRowsParams
    pageSize: number
    result: TableDataGridFetcherResult<Row>
  }) => {
    // Store each response cursor on the block that produced it so the next
    // block can use that cursor instead of exposing AG Grid ranges publicly.
    if (result.cursor !== undefined) {
      cursorMap.set(blockIndex, result.cursor)
    }

    getRowsParams.successCallback(result.data, resolveInfiniteLastRow({
      startRow: getRowsParams.startRow,
      rowsLength: result.data.length,
      pageSize,
      total: result.total,
      hasMore: result.hasMore,
    }))

    if (getRowsParams.startRow === 0) {
      data.value = result.data
    }
    currentBlockCompletion.resolve(true)
  }

  const handleFailedBlock = ({
    blockIndex,
    currentBlockCompletion,
    fetchError,
    getRowsParams,
  }: {
    blockIndex: number
    currentBlockCompletion: BlockCompletion
    fetchError: unknown
    getRowsParams: IGetRowsParams
  }) => {
    // Failed blocks must unblock any dependent later block and notify AG Grid
    // through its datasource callback so it can retry according to grid policy.
    error.value = fetchError
    getRowsParams.failCallback()
    rejectBlockCompletion(blockIndex, currentBlockCompletion)
  }

  const buildDatasource = (): IDatasource => {
    // A new datasource is a fresh cursor chain. Incrementing the id lets
    // in-flight requests from an older datasource resolve without mutating the
    // current state or calling callbacks on the replaced datasource.
    const datasourceId = latestDatasourceId.value + 1
    latestDatasourceId.value = datasourceId
    cursorMap.clear()
    blockCompletionMap.clear()
    data.value = undefined
    error.value = undefined
    pendingFetchCount.value = 0
    syncIsFetching()

    return {
      async getRows(getRowsParams) {
        // AG Grid owns block scheduling and supplies zero-based row ranges.
        // This layer converts those ranges into cursor-chain blocks before
        // calling the public fetcher.
        const {
          blockIndex,
          pageSize,
        } = getCursorBlock({
          startRow: getRowsParams.startRow,
          endRow: getRowsParams.endRow,
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

        markFetchStarted()
        try {
          const cursor = blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined
          const result = await fetcher({
            mode: 'infinite',
            pageSize,
            cursor,
          })

          if (!isLatestDatasource(datasourceId)) {
            rejectBlockCompletion(blockIndex, currentBlockCompletion)
            return
          }

          handleSuccessfulBlock({
            blockIndex,
            currentBlockCompletion,
            getRowsParams,
            pageSize,
            result,
          })
        } catch (fetchError) {
          if (!isLatestDatasource(datasourceId)) {
            rejectBlockCompletion(blockIndex, currentBlockCompletion)
            return
          }

          handleFailedBlock({
            blockIndex,
            currentBlockCompletion,
            fetchError,
            getRowsParams,
          })
        } finally {
          if (isLatestDatasource(datasourceId)) {
            markFetchFinished()
          }
        }
      },
    }
  }

  const resetDatasource = () => {
    // In infinite cursor mode, reset means starting over from block 0. Cursors
    // are only valid relative to the response/query chain that produced them, so
    // parent invalidation or request-shape changes must clear the cursor chain
    // instead of reusing later block cursors from the previous datasource.
    datasource.value = buildDatasource()
  }

  watch(
    () => resetKey?.value,
    () => {
      resetDatasource()
    },
    { immediate: true },
  )

  return {
    datasource: readonly(datasource),
    data: readonly(data),
    error: readonly(error),
    isFetching: readonly(isFetching),
  }
}
