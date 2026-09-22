import type { Ref } from 'vue'
import { computed } from 'vue'

export enum fetchState {
  PENDING = 'PENDING',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

type UseFetchStateResult = {
  fetchState: typeof fetchState
  hasData: Readonly<Ref<boolean>>
  state: Readonly<Ref<fetchState>>
}

type FetchStateData<Row> = readonly Row[] | undefined

const defaultHasData = <Row>(data: FetchStateData<Row>): boolean => (
  Boolean(data?.length)
)

/**
 * Derives TableDataGrid fetch state from fetch lifecycle refs.
 *
 * `data`, `error`, and `isFetching` are owned by the fetch orchestration
 * composable. This helper only reads those refs and exposes a readonly derived
 * state without owning mutation or request lifecycle behavior.
 *
 * @param data Current rows from the active fetch chain, or `undefined` before
 * the first fetch result resolves.
 * @param error Current fetch error, if one exists.
 * @param isFetching Whether at least one fetch request is currently pending.
 * @param hasDataCallback Optional row detector for callers that need a custom
 * definition of meaningful data.
 * @param errorTakesPrecedence Whether a settled error should remain visible
 * when rows from an earlier request are still available. Infinite consumers
 * retain their existing data-first behavior by default.
 */
export default function useFetchState<Row>(
  data: Readonly<Ref<FetchStateData<Row>>>,
  error: Readonly<Ref<unknown>>,
  isFetching: Readonly<Ref<boolean>>,
  hasDataCallback: (data: FetchStateData<Row>) => boolean = defaultHasData,
  errorTakesPrecedence = false,
): UseFetchStateResult {
  const hasData = computed<boolean>(() => hasDataCallback(data.value))

  const state = computed<fetchState>(() => {
    const dataValue = data.value
    const hasResolvedData = dataValue !== undefined
    const hasError = error.value !== undefined && error.value !== null

    if (isFetching.value) {
      return fetchState.LOADING
    }

    if (hasError && errorTakesPrecedence) {
      return fetchState.ERROR
    }

    if (hasData.value) {
      return fetchState.SUCCESS
    }

    if (hasError) {
      return fetchState.ERROR
    }

    if (hasResolvedData) {
      return fetchState.SUCCESS
    }

    return fetchState.PENDING
  })

  return {
    fetchState,
    hasData,
    state,
  }
}
