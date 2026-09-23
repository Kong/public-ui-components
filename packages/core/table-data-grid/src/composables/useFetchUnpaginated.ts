import type {
  TableDataGridRow,
  TableDataGridUnpaginatedFetcher,
} from '../types'
import type { Ref } from 'vue'
import { getCurrentScope, onScopeDispose, readonly, ref, shallowReadonly, shallowRef, watch } from 'vue'

interface UseFetchUnpaginatedOptions<Row extends object = TableDataGridRow> {
  /** Public fetcher supplied by the host. */
  fetcher: Readonly<Ref<TableDataGridUnpaginatedFetcher<Row>>>
  /** Reactive invalidation input for the current query context. */
  resetKey?: Readonly<Ref<unknown>>
}

/**
 * Owns the one-request lifecycle for a complete, non-paginated result.
 *
 * The client-side row model consumes the returned rows directly. A request
 * generation keeps responses from an invalidated query from replacing current
 * rows, errors, or loading state. Refresh retains previous rows while replacement
 * requests run; same-turn invalidations are batched into one fetch.
 *
 * @param options - Fetcher and request invalidation inputs.
 * @param options.fetcher - Reactive fetcher returning the complete result.
 * @param options.resetKey - Optional reactive query-context invalidation key.
 * @returns Readonly rows, error, and loading state, with no infinite datasource.
 */
export const useFetchUnpaginated = <Row extends object = TableDataGridRow>({
  fetcher,
  resetKey,
}: UseFetchUnpaginatedOptions<Row>) => {
  const data = shallowRef<Row[] | undefined>()
  const error = shallowRef<unknown>()
  const isFetching = ref(false)
  let latestRequestId = 0
  let fetchScheduled = false
  let disposed = false

  const fetchRows = async () => {
    if (disposed) {
      return
    }

    const requestId = ++latestRequestId
    const requestFetcher = fetcher.value
    const requestResetKey = resetKey?.value
    const isCurrent = () => requestId === latestRequestId
      && requestFetcher === fetcher.value
      && requestResetKey === resetKey?.value
    isFetching.value = true
    error.value = undefined

    try {
      const result = await requestFetcher({ mode: 'unpaginated' })

      if (!isCurrent()) {
        return
      }

      data.value = result.data
    } catch (fetchError) {
      if (isCurrent()) {
        error.value = fetchError
      }
    } finally {
      if (isCurrent()) {
        isFetching.value = false
      }
    }
  }

  const invalidate = () => {
    // Invalidate the current request before starting its replacement.
    latestRequestId += 1
    isFetching.value = true
    error.value = undefined

    if (fetchScheduled) {
      return
    }

    fetchScheduled = true
    // Batch fetcher and context changes in this turn into one replacement load.
    queueMicrotask(() => {
      fetchScheduled = false
      void fetchRows()
    })
  }

  watch(
    [
      () => resetKey?.value,
      fetcher,
    ],
    invalidate,
  )
  void fetchRows()

  if (getCurrentScope()) {
    onScopeDispose(() => {
      // A component can be replaced while its request is still pending. The
      // generation guard makes that request inert when its promise settles.
      disposed = true
      latestRequestId += 1
    })
  }

  return {
    // AG Grid and host callbacks must receive the fetcher's row objects, not deep readonly proxies.
    data: shallowReadonly(data),
    // The client-side row model has no AG Grid datasource. Keeping this
    // explicit lets the component bind one common fetch-result shape without
    // creating the infinite cursor machinery for this mode.
    datasource: undefined,
    error: readonly(error),
    isFetching: readonly(isFetching),
  }
}
