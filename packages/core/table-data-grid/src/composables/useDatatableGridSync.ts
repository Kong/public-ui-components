import type {
  TableDataGridConfig,
} from '../types'
import type {
  TableDataGridGridSyncConfig,
  TableDataGridGridSyncEmit,
  TableDataGridGridSyncFetch,
  TableDataGridGridSyncGrid,
  TableDataGridGridSyncSelection,
  TableDataGridGridSyncSizingHandlers,
} from '../types/internal'
import type {
  ColumnResizedEvent,
  DisplayedColumnsChangedEvent,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import { ref, shallowRef, watch } from 'vue'
import { getSortKey, normalizedTableConfigsEqual } from '../utils/tableConfig'
import {
  createLayoutSnapshot,
  createRefreshParamsForConfigChange,
  hasColumnVisibilityChanged,
  hasSelectionColumn,
} from '../utils/gridSync'

export const useDatatableGridSync = <Row extends Record<string, any>>({
  config,
  emit,
  fetch,
  grid,
  selection,
  sizingHandlers,
}: {
  config: TableDataGridGridSyncConfig<Row>
  emit: TableDataGridGridSyncEmit<Row>
  fetch: TableDataGridGridSyncFetch
  grid: TableDataGridGridSyncGrid<Row>
  selection: TableDataGridGridSyncSelection
  sizingHandlers: TableDataGridGridSyncSizingHandlers<Row>
}) => {
  const {
    activePageSize,
    applyTableConfig,
    captureGridConfig,
    isApplyingTableConfig,
    patchTableConfig,
    resolvedSort,
    resolvedTableConfig,
  } = config
  const {
    mode,
    resetFetched,
    refresh,
  } = fetch
  const {
    getGridConfig,
    gridApi,
  } = grid
  const {
    rowSelection,
  } = selection

  const displayedColumnIndexesByKey = shallowRef(new Map<string, number>())
  const isApplyingInitialColumnState = ref(false)
  const isRowSelectionColumnRefitPending = ref(false)

  const applyResolvedTableConfig = (api: GridApi<Row>) => {
    isApplyingTableConfig.value = true
    try {
      applyTableConfig(api)
    } finally {
      isApplyingTableConfig.value = false
    }
  }

  const refreshForConfigChange = (
    nextConfig: TableDataGridConfig,
    previousConfig: TableDataGridConfig,
  ) => {
    const refreshParams = createRefreshParamsForConfigChange({
      mode: mode.value,
      nextConfig,
      previousConfig,
    })
    if (!refreshParams) {
      return
    }

    refresh(refreshParams)
  }

  const updateDisplayedColumnIndexes = (api = gridApi.value) => {
    displayedColumnIndexesByKey.value = api
      ? new Map(api.getAllDisplayedColumns().map((column, index) => [column.getColId(), index]))
      : new Map()
  }

  const onGridReady = (event: GridReadyEvent<Row>) => {
    resetFetched()
    isApplyingInitialColumnState.value = true
    applyResolvedTableConfig(event.api)
    sizingHandlers.fitColumnsOnGridReady(event.api)
    captureGridConfig(event.api)
    gridApi.value = event.api
    updateDisplayedColumnIndexes(event.api)
    emit.gridReady(event.api)
    refresh(resolvedSort.value)
    // AG Grid emits initial column visibility events while applyColumnState runs;
    // defer user-driven refits until that first layout frame has completed.
    requestAnimationFrame(() => {
      isApplyingInitialColumnState.value = false
      sizingHandlers.startResizeTracking()
    })
  }

  const onColumnPinned = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    sizingHandlers.emitGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
  }

  const onColumnLayoutChange = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    sizingHandlers.emitGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
  }

  const onColumnVisibilityChange = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    sizingHandlers.emitGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
    if (isApplyingInitialColumnState.value) {
      return
    }

    sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange()
  }

  const onDisplayedColumnsChange = (event: DisplayedColumnsChangedEvent<Row>) => {
    updateDisplayedColumnIndexes(event.api)
    if (!isRowSelectionColumnRefitPending.value) {
      return
    }

    isRowSelectionColumnRefitPending.value = false
    sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange(event.api)
  }

  const onModelUpdated = (event: { api: GridApi<Row> }) => {
    if (mode.value !== 'infinite' || event.api.getDisplayedRowCount() === 0) {
      return
    }

    sizingHandlers.scheduleColumnsToFitAfterRenderedRowsChange(event.api)
  }

  const onColumnResize = (event: ColumnResizedEvent<Row>) => {
    // sizeColumnsToFit emits resize events for our own fitting writes; only user
    // resize completions should persist column widths into tableConfig.
    if (event.source !== 'sizeColumnsToFit' && event.finished !== false) {
      sizingHandlers.emitGridConfigChange()
    }
  }

  const onSortChange = () => {
    const api = gridApi.value
    if (!api) {
      return
    }

    const nextConfig = getGridConfig(api)
    const sortChanged = getSortKey(nextConfig) !== getSortKey(resolvedTableConfig.value)
    if (!sortChanged) {
      return
    }

    emit.sort({
      sortColumnKey: nextConfig.sortColumnKey,
      sortColumnOrder: nextConfig.sortColumnOrder,
    })
    patchTableConfig({
      sortColumnKey: nextConfig.sortColumnKey,
      sortColumnOrder: nextConfig.sortColumnOrder,
    })
  }

  const onPageSizeChange = ({ pageSize: nextPageSize }: { pageSize: number }) => {
    if (nextPageSize === activePageSize.value) {
      return
    }

    patchTableConfig({ pageSize: nextPageSize })
  }

  watch(() => resolvedTableConfig.value, (nextConfig, previousConfig) => {
    if (gridApi.value) {
      refreshForConfigChange(nextConfig, previousConfig)
    }

    const nextLayoutConfig = createLayoutSnapshot(nextConfig)
    const previousLayoutConfig = createLayoutSnapshot(previousConfig)
    if (normalizedTableConfigsEqual(nextLayoutConfig, previousLayoutConfig)) {
      return
    }

    const api = gridApi.value
    if (!api) {
      return
    }

    const gridConfig = getGridConfig(api)
    if (normalizedTableConfigsEqual(createLayoutSnapshot(gridConfig), nextLayoutConfig)) {
      return
    }

    const didColumnVisibilityChange = hasColumnVisibilityChanged({
      nextConfig,
      previousConfig: gridConfig,
    })
    applyResolvedTableConfig(api)
    if (didColumnVisibilityChange) {
      sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange()
      return
    }

    if (sizingHandlers.shouldRefitColumnsAfterConfigChange()) {
      sizingHandlers.scheduleColumnsToFit({ persistFittedConfig: true })
    }
  })

  watch(() => rowSelection.value, (nextSelectionMode, previousSelectionMode) => {
    if (hasSelectionColumn(nextSelectionMode) === hasSelectionColumn(previousSelectionMode)) {
      return
    }

    isRowSelectionColumnRefitPending.value = true
  })

  return {
    applyResolvedTableConfig,
    displayedColumnIndexesByKey,
    isApplyingInitialColumnState,
    isApplyingTableConfig,
    isRowSelectionColumnRefitPending,
    onColumnLayoutChange,
    onColumnPinned,
    onColumnResize,
    onColumnVisibilityChange,
    onDisplayedColumnsChange,
    onGridReady,
    onModelUpdated,
    onPageSizeChange,
    onSortChange,
    refreshForConfigChange,
    updateDisplayedColumnIndexes,
  }
}
