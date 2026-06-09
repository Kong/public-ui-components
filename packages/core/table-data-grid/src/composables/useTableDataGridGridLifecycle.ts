import type {
  TableDataGridSort,
} from '../types'
import type {
  TableDataGridLifecycleSizingHandlers,
} from '../types/internal'
import type {
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import type { Ref } from 'vue'

/**
 * Owns one-time grid-ready orchestration.
 *
 * On grid ready it applies the resolved config, captures the mounted AG Grid
 * state, publishes the GridApi, initializes sizing, resets fetch state, and
 * starts the first refresh. Later config sync is owned elsewhere.
 */
export const useTableDataGridGridLifecycle = <Row extends Record<string, any>>({
  applyTableConfig,
  captureGridConfig,
  emitGridReady,
  gridApi,
  isApplyingInitialColumnState,
  isApplyingTableConfig,
  refresh,
  resetFetched,
  resolvedSort,
  sizing,
  updateDisplayedColumnIndexes,
}: {
  applyTableConfig: (api?: GridApi<Row>) => void
  captureGridConfig: (api: GridApi<Row>) => void
  emitGridReady: (api: GridApi<Row>) => void
  gridApi: Ref<GridApi<Row> | undefined>
  isApplyingInitialColumnState: Ref<boolean>
  isApplyingTableConfig: Ref<boolean>
  refresh: (params?: Partial<TableDataGridSort & { pageSize: number }>) => void
  resetFetched: () => void
  resolvedSort: Readonly<Ref<TableDataGridSort>>
  sizing: TableDataGridLifecycleSizingHandlers<Row>
  updateDisplayedColumnIndexes: (api?: GridApi<Row>) => void
}) => {
  const applyResolvedTableConfig = (api: GridApi<Row>) => {
    isApplyingTableConfig.value = true
    try {
      applyTableConfig(api)
    } finally {
      isApplyingTableConfig.value = false
    }
  }

  const onGridReady = (event: GridReadyEvent<Row>) => {
    resetFetched()
    isApplyingInitialColumnState.value = true
    applyResolvedTableConfig(event.api)
    sizing.fitColumnsOnGridReady(event.api)
    captureGridConfig(event.api)
    gridApi.value = event.api
    updateDisplayedColumnIndexes(event.api)
    emitGridReady(event.api)
    refresh(resolvedSort.value)
    // AG Grid emits initial column visibility events while applyColumnState runs;
    // defer user-driven refits until that first layout frame has completed.
    requestAnimationFrame(() => {
      isApplyingInitialColumnState.value = false
      sizing.startResizeTracking()
    })
  }

  return {
    applyResolvedTableConfig,
    onGridReady,
  }
}
