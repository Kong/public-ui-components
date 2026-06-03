import type {
  TableDataGridState,
  TableDataGridStatePayload,
} from '../types'
import type { Ref, ShallowRef } from 'vue'
import { computed, watch } from 'vue'

export const useTableDataGridState = <Row extends Record<string, any>>({
  emit,
  fetch,
  inputs,
}: {
  emit: {
    state: (payload: TableDataGridStatePayload) => void
  }
  fetch: {
    fetchError: Readonly<Ref<unknown>>
    hasFetched: Readonly<Ref<boolean>>
    isFetching: Readonly<Ref<boolean>>
    rowData: Readonly<ShallowRef<Row[]>>
  }
  inputs: {
    error: Readonly<Ref<boolean>>
    loading: Readonly<Ref<boolean>>
  }
}) => {
  const hasRows = computed(() => fetch.rowData.value.length > 0)
  const shouldShowErrorState = computed(() => inputs.error.value || (Boolean(fetch.fetchError.value) && !hasRows.value))
  const shouldEmitLoadingState = computed(() => (
    inputs.loading.value || (!hasRows.value && (!fetch.hasFetched.value || fetch.isFetching.value))
  ))
  const isEmpty = computed(() => (
    fetch.hasFetched.value
      && !fetch.isFetching.value
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

  watch(datatableState, state => emit.state({
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
