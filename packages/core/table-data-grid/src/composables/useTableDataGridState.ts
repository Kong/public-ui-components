import type {
  TableDataGridState,
  TableDataGridStatePayload,
} from '../types'
import type { Ref, ShallowRef } from 'vue'
import { computed, watch } from 'vue'

/**
 * Owns user-visible table state derivation.
 *
 * It does not mutate fetch state. Host-forced loading/error props control
 * rendered chrome; shared fetch-state signals keep the public `state` event in
 * sync with request lifecycle and fetch failures.
 */
export const useTableDataGridState = <Row extends Record<string, any>>({
  emitState,
  error,
  hasFetchError,
  hasFetched,
  isFetching,
  loading,
  rowData,
}: {
  emitState: (payload: TableDataGridStatePayload) => void
  error: Readonly<Ref<boolean>>
  hasFetchError: Readonly<Ref<boolean>>
  hasFetched: Readonly<Ref<boolean>>
  isFetching: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
  rowData: Readonly<ShallowRef<Row[]>>
}) => {
  const hasRows = computed(() => rowData.value.length > 0)
  const shouldShowErrorState = computed(() => error.value)
  const shouldEmitFetchErrorState = computed(() => hasFetchError.value && !hasRows.value)
  const shouldEmitLoadingState = computed(() => (
    loading.value || (!hasRows.value && (!hasFetched.value || isFetching.value))
  ))
  const isEmpty = computed(() => (
    hasFetched.value
      && !isFetching.value
      && !hasRows.value
      && !loading.value
      && !shouldShowErrorState.value
  ))
  const datatableState = computed<TableDataGridState>(() => {
    if (shouldShowErrorState.value) {
      return 'error'
    }

    if (shouldEmitLoadingState.value) {
      return 'loading'
    }

    if (shouldEmitFetchErrorState.value) {
      return 'error'
    }

    if (isEmpty.value) {
      return 'empty'
    }

    return 'success'
  })

  watch(datatableState, state => emitState({
    state,
    hasData: hasRows.value,
  }), { immediate: true })

  return {
    datatableState,
    hasRows,
    isEmpty,
    shouldShowErrorState,
  }
}
