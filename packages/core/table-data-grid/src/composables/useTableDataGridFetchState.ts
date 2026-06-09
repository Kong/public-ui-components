import type {
  TableDataGridFetchModeSources,
} from '../types/internal'
import type { IDatasource } from 'ag-grid-community'
import { computed, ref, shallowRef } from 'vue'

/**
 * Owns fetch state shared by pagination mode, infinite mode, and table state.
 */
export const useTableDataGridFetchState = <Row extends Record<string, any>>(): TableDataGridFetchModeSources<Row>['state'] => {
  const currentPage = ref(1)
  const datasource = ref<IDatasource>()
  const hasFetched = ref(false)
  const hasFetchError = ref(false)
  const hasNextPageWhenTotalUnknown = ref(false)
  const pendingFetchCount = ref(0)
  const rowData = shallowRef<Row[]>([])
  const totalRows = ref<number>()
  const isFetching = computed(() => pendingFetchCount.value > 0)

  const markFetchStarted = () => {
    hasFetchError.value = false
    pendingFetchCount.value += 1
  }

  const markFetchFinished = ({ markFetched = true }: { markFetched?: boolean } = {}) => {
    // Guards against an extra finish call after an interrupted or rejected request path.
    pendingFetchCount.value = Math.max(0, pendingFetchCount.value - 1)
    if (markFetched) {
      hasFetched.value = true
    }
  }

  const resetFetched = () => {
    hasFetched.value = false
  }

  return {
    currentPage,
    datasource,
    hasFetched,
    hasFetchError,
    hasNextPageWhenTotalUnknown,
    isFetching,
    markFetchStarted,
    markFetchFinished,
    resetFetched,
    rowData,
    totalRows,
  }
}
