import type {
  TableDataGridConfig,
  TableDataGridMode,
  TableDataGridRowSelectionMode,
  TableDataGridSort,
} from '../types'
import type { GridColumnWidthChangeSource } from '../types/internal'
import type {
  ColumnResizedEvent,
  DisplayedColumnsChangedEvent,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { ref, shallowRef, watch } from 'vue'
import isEqual from 'lodash-es/isEqual'
import { getSortKey, normalizedTableConfigsEqual } from '../utils/tableConfig'

type DatatableColumnSizingHandlers<Row extends Record<string, any>> = {
  emitGridConfigChange: (options?: {
    columnWidthChangeSource?: GridColumnWidthChangeSource
  }) => void
  fitColumnsOnGridReady: (api: GridApi<Row>) => void
  scheduleColumnsToFit: (options?: {
    api?: GridApi<Row>
    persistFittedConfig?: boolean
    honorConfiguredColumnWidths?: boolean
  }) => void
  scheduleColumnsToFitAfterDisplayedColumnsChange: (api?: GridApi<Row>) => void
  shouldRefitColumnsAfterConfigChange: () => boolean
  startResizeTracking: () => void
}

const createLayoutSnapshot = (config: TableDataGridConfig): TableDataGridConfig => ({
  columnOrder: config.columnOrder,
  columnVisibility: config.columnVisibility,
  columnWidths: config.columnWidths,
  pinnedColumns: config.pinnedColumns,
  sortColumnKey: undefined,
  sortColumnOrder: undefined,
  pageSize: undefined,
})

export const useDatatableGridSync = <Row extends Record<string, any>>({
  activePageSize,
  captureGridConfig,
  applyTableConfig,
  emitGridReady,
  emitSort,
  getGridConfig,
  gridApi,
  mode,
  patchTableConfig,
  resetFetched,
  refresh,
  resolvedSort,
  resolvedTableConfig,
  rowSelection,
}: {
  activePageSize: Readonly<Ref<number>>
  captureGridConfig: (api: GridApi<Row>) => void
  applyTableConfig: (api?: GridApi<Row>) => void
  emitGridReady: (api: GridApi<Row>) => void
  emitSort: (sort: TableDataGridSort) => void
  getGridConfig: (api: GridApi<Row>) => TableDataGridConfig
  gridApi: Ref<GridApi<Row> | undefined>
  mode: Readonly<Ref<TableDataGridMode>>
  patchTableConfig: (config: Partial<TableDataGridConfig>) => void
  resetFetched: () => void
  refresh: (params?: Partial<TableDataGridSort & { pageSize: number }>) => void
  resolvedSort: Readonly<Ref<Pick<TableDataGridSort, 'sortColumnKey' | 'sortColumnOrder'>>>
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
  rowSelection: Readonly<Ref<TableDataGridRowSelectionMode>>
}) => {
  const displayedColumnIndexesByKey = shallowRef(new Map<string, number>())
  const isApplyingTableConfig = ref(false)
  const isApplyingInitialColumnState = ref(false)
  const isRowSelectionColumnRefitPending = ref(false)

  let sizingHandlers: DatatableColumnSizingHandlers<Row> | undefined

  const connectSizing = (handlers: DatatableColumnSizingHandlers<Row>) => {
    if (sizingHandlers) {
      throw new Error('useDatatableGridSync sizing handlers are already connected')
    }

    sizingHandlers = handlers
  }

  const getSizingHandlers = () => {
    if (!sizingHandlers) {
      throw new Error('useDatatableGridSync requires connectSizing before handling grid events')
    }

    return sizingHandlers
  }

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
    const sortChanged = getSortKey(nextConfig) !== getSortKey(previousConfig)
    const pageSizeChanged = nextConfig.pageSize !== previousConfig.pageSize
    const shouldRefreshForSort = sortChanged && mode.value !== 'infinite'

    if (!shouldRefreshForSort && !pageSizeChanged) {
      return
    }

    refresh({
      ...(pageSizeChanged && typeof nextConfig.pageSize === 'number' ? { pageSize: nextConfig.pageSize } : {}),
      ...(shouldRefreshForSort
        ? {
          sortColumnKey: nextConfig.sortColumnKey,
          sortColumnOrder: nextConfig.sortColumnOrder,
        }
        : {}),
    })
  }

  const hasColumnVisibilityChanged = (
    nextConfig: TableDataGridConfig,
    previousConfig: TableDataGridConfig,
  ) => {
    const nextColumnVisibility = nextConfig.columnVisibility ?? {}
    const previousColumnVisibility = previousConfig.columnVisibility ?? {}
    return !isEqual(nextColumnVisibility, previousColumnVisibility)
  }

  const updateDisplayedColumnIndexes = (api = gridApi.value) => {
    displayedColumnIndexesByKey.value = api
      ? new Map(api.getAllDisplayedColumns().map((column, index) => [column.getColId(), index]))
      : new Map()
  }

  const onGridReady = (event: GridReadyEvent<Row>) => {
    const sizing = getSizingHandlers()
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

  const onColumnPinned = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    getSizingHandlers().emitGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
  }

  const onColumnLayoutChange = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    getSizingHandlers().emitGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
  }

  const onColumnVisibilityChange = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    const sizing = getSizingHandlers()
    sizing.emitGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
    if (isApplyingInitialColumnState.value) {
      return
    }

    sizing.scheduleColumnsToFitAfterDisplayedColumnsChange()
  }

  const onDisplayedColumnsChange = (event: DisplayedColumnsChangedEvent<Row>) => {
    updateDisplayedColumnIndexes(event.api)
    if (!isRowSelectionColumnRefitPending.value) {
      return
    }

    isRowSelectionColumnRefitPending.value = false
    getSizingHandlers().scheduleColumnsToFitAfterDisplayedColumnsChange(event.api)
  }

  const onColumnResize = (event: ColumnResizedEvent<Row>) => {
    // sizeColumnsToFit emits resize events for our own fitting writes; only user
    // resize completions should persist column widths into tableConfig.
    if (event.source !== 'sizeColumnsToFit' && event.finished !== false) {
      getSizingHandlers().emitGridConfigChange()
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

    emitSort({
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

    const didColumnVisibilityChange = hasColumnVisibilityChanged(nextConfig, gridConfig)
    applyResolvedTableConfig(api)
    if (didColumnVisibilityChange) {
      getSizingHandlers().scheduleColumnsToFitAfterDisplayedColumnsChange()
      return
    }

    const sizing = getSizingHandlers()
    if (sizing.shouldRefitColumnsAfterConfigChange()) {
      sizing.scheduleColumnsToFit({ persistFittedConfig: true })
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
    connectSizing,
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
    onPageSizeChange,
    onSortChange,
    refreshForConfigChange,
    updateDisplayedColumnIndexes,
  }
}

const hasSelectionColumn = (selectionMode: TableDataGridRowSelectionMode) => selectionMode === 'multiple'
