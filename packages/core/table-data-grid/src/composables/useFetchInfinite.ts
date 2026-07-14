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
 *
 * @param fetcher Host-supplied fetcher that uses TableDataGrid's cursor-first
 * infinite mode contract.
 * @param resetKey Optional reactive invalidation key that rebuilds the
 * datasource and restarts the cursor chain.
 * @returns Readonly datasource, first-block data, error, and fetching state
 * refs for the active AG Grid infinite datasource.
 */
export const useFetchInfinite = <Row extends object = TableDataGridRow>({
  fetcher,
  resetKey,
}: UseFetchInfiniteOptions<Row>) => {
  // AG Grid thinks in row ranges; the public TableDataGrid fetcher thinks in a
  // cursor chain. These maps keep that translation internal to the datasource.
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

    // Later blocks await this promise so they do not call a cursor-backed API
    // before the previous block has had a chance to return its next cursor.
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

  /**
   * Gates later blocks on the previous block's completion.
   *
   * Cursor-backed blocks are sequential even if AG Grid requests them
   * concurrently. A later block can only fetch after the previous block has
   * either produced the cursor it needs or failed.
   *
   * @param blockIndex Current AG Grid block index derived from the row range.
   * @param currentBlockCompletion Completion gate registered for the current
   * block.
   * @param datasourceId Identifier for the datasource instance that started the
   * request.
   * @returns Whether the current block is ready to fetch, failed dependency
   * gating, or became stale after a datasource reset.
   */
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
      // AG Grid can ask for block N before it has asked for block N - 1. That
      // is valid for range-based APIs, but not for a cursor chain, so fail this
      // attempt and let AG Grid retry according to its normal block policy.
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

  /**
   * Completes AG Grid's datasource request for a successfully fetched block.
   *
   * The cursor is stored on the block that produced it so the next block can
   * continue the chain, while AG Grid receives only rows and its `lastRow`
   * signal through `successCallback`.
   *
   * @param blockIndex Current AG Grid block index derived from the row range.
   * @param currentBlockCompletion Completion gate registered for the current
   * block.
   * @param getRowsParams AG Grid datasource request parameters and callbacks.
   * @param pageSize Requested block size derived from AG Grid's row range.
   * @param result Rows and pagination metadata returned by the TableDataGrid
   * fetcher.
   * @returns Nothing. Completes the AG Grid datasource request via callback.
   */
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

    // AG Grid only considers this block loaded after one datasource callback is
    // invoked. `lastRow` is optional; undefined means the grid may ask for the
    // next block later.
    getRowsParams.successCallback(result.data, resolveInfiniteLastRow({
      startRow: getRowsParams.startRow,
      rowsLength: result.data.length,
      pageSize,
      total: result.total,
      hasMore: result.hasMore,
    }))

    // The first block is enough for component-level empty/data state. Later
    // blocks are owned by AG Grid's row cache and should not replace that state.
    if (getRowsParams.startRow === 0) {
      data.value = result.data
    }
    currentBlockCompletion.resolve(true)
  }

  /**
   * Completes AG Grid's datasource request for a failed block.
   *
   * Failed blocks must unblock any dependent later block and notify AG Grid
   * through its datasource callback so it can retry according to grid policy.
   *
   * @param blockIndex Current AG Grid block index derived from the row range.
   * @param currentBlockCompletion Completion gate registered for the current
   * block.
   * @param fetchError Error thrown by the TableDataGrid fetcher.
   * @param getRowsParams AG Grid datasource request parameters and callbacks.
   * @returns Nothing. Completes the AG Grid datasource request via callback.
   */
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
    error.value = fetchError
    getRowsParams.failCallback()
    rejectBlockCompletion(blockIndex, currentBlockCompletion)
  }

  /**
   * Creates a new AG Grid datasource and resets cursor-chain state.
   *
   * A new datasource is a fresh cursor chain. Incrementing the id lets in-flight
   * requests from an older datasource resolve without mutating current state or
   * calling callbacks on the replaced datasource.
   *
   * @returns AG Grid datasource for the latest cursor chain.
   */
  const buildDatasource = (): IDatasource => {
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

        // Register the current block before waiting so any following block can
        // find a completion promise instead of treating this request as missing.
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
          // AG Grid schedules blocks by row range, so `blockIndex` is this
          // composable's range-to-cursor bridge: range 0-25 maps to block 0,
          // range 25-50 maps to block 1, and so on. Block 0 starts the public
          // fetcher with no cursor. Every later block reads the cursor stored
          // for the previous block, because that previous AG Grid range is what
          // produced the backend cursor needed to continue the chain.
          const cursor = blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined
          const result = await fetcher({
            mode: 'infinite',
            pageSize,
            cursor,
          })

          if (!isLatestDatasource(datasourceId)) {
            // A reset replaced the datasource while this request was in flight.
            // Do not call callbacks on the old datasource or mutate current state.
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
            // The latest datasource will issue its own requests; the stale
            // failure should not surface as a current-grid error.
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
