import { toValue, ref, computed } from 'vue'
import type { Ref } from 'vue'
import type { TableStateParams } from '../types'

// This composable is used to access the table data state and provide shared logic
// for hiding toolbars, etc.
export default function useTableState(query?: Ref<string> | (() => string)) {
  let previousQuery = ''

  const hasRecords = ref(false)
  const tableState = ref<TableStateParams | null>(null)

  const hideTableToolbar = computed(() => {
    let showTableToolbar

    if (hasRecords.value) {
      showTableToolbar = true
    } else if (!tableState.value) {
      // Initial state, hide the toolbar
      showTableToolbar = false
    } else {
      showTableToolbar = tableState.value.hasData || (query && toValue(query))
    }

    return !showTableToolbar
  })

  const handleStateChange = (stateParams: TableStateParams): void => {
    if (stateParams.hasData) {
      // In our scenario, as long as the table contains any data at any time,
      // it indicates that there is at least a corresponding entity record in the backend.
      hasRecords.value = true
    } else if (stateParams.state === 'success' && !stateParams.hasData && (!query || !previousQuery)) {
      // If the table is in a success state but has no data and no query, it means there are no records
      // Why do we record the previous query:
      // When we clear the query, the table `state` event will be emitted in the following order:
      // - Immediately: { state: 'success', hasData: <from-cache> }, query: ''
      // - After revalidation: { state: 'success', hasData: <from-backend> }, query: '' <- This is the one we want to capture
      // So we'll have to record the previous query to reset `hasRecords` correctly after revalidation
      // - Immediately: { state: 'success', hasData: <from-cache> }, previousQuery: 'foo', query: '' <- just check previous query
      // - After revalidation: { state: 'success', hasData: <from-backend> }, previousQuery: '', query: ''
      hasRecords.value = false
    }

    if (query) {
      previousQuery = toValue(query)
    }

    tableState.value = { ...stateParams }
  }

  return {
    tableState,
    hasRecords,
    hideTableToolbar,
    handleStateChange,
  }
}
