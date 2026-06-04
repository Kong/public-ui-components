import type {
  TableDataGridState,
  TableDataGridStatePayload,
} from '../types'
import type { Ref, ShallowRef } from 'vue'
import { computed, watch } from 'vue'

/**
 * Owns user-visible table state derivation.
 *
 * It does not mutate fetch state. Fetch refs and external loading/error props
 * are inputs; the derived state controls empty/error/loading rendering and the
 * public `state` event payload.
 */
export const useTableDataGridState = <Row extends Record<string, any>>({
  emitState,
  error,
  fetchError,
  hasFetched,
  isFetching,
  loading,
  rowData,
}: {
  emitState: (payload: TableDataGridStatePayload) => void
  error: Readonly<Ref<boolean>>
  fetchError: Readonly<Ref<unknown>>
  hasFetched: Readonly<Ref<boolean>>
  isFetching: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
  rowData: Readonly<ShallowRef<Row[]>>
}) => {
  const hasRows = computed(() => rowData.value.length > 0)
  const shouldShowErrorState = computed(() => error.value || (Boolean(fetchError.value) && !hasRows.value))
  const shouldEmitLoadingState = computed(() => (
    loading.value || (!hasRows.value && (!hasFetched.value || isFetching.value))
  ))
  const isEmpty = computed(() => (
    hasFetched.value
      && !isFetching.value
      && !hasRows.value
      && !shouldShowErrorState.value
  ))
  const datatableState = computed<TableDataGridState>(() => {
    if (shouldEmitLoadingState.value) {
      return 'loading'
    }

    if (shouldShowErrorState.value) {
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
