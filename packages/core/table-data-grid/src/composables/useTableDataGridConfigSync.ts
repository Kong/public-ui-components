import type {
  TableDataGridConfig,
  TableDataGridMode,
  TableDataGridSort,
} from '../types'
import type {
  TableDataGridConfigSyncSizingHandlers,
} from '../types/internal'
import type { GridApi } from 'ag-grid-community'
import type { Ref } from 'vue'
import { watch } from 'vue'
import { getSortKey, normalizedTableConfigsEqual } from '../utils/tableConfig'
import {
  createLayoutSnapshot,
  createRefreshParamsForConfigChange,
  hasColumnVisibilityChanged,
} from '../utils/gridSync'

/**
 * Owns side effects caused by resolved tableConfig changes after the grid exists.
 *
 * This is the bridge between the config source of truth and AG Grid: sort/page
 * size writes patch tableConfig, meaningful config changes trigger refreshes,
 * and layout config changes are replayed into AG Grid.
 */
export const useTableDataGridConfigSync = <Row extends Record<string, any>>({
  activePageSize,
  applyResolvedTableConfig,
  emitSort,
  getGridConfig,
  gridApi,
  mode,
  patchTableConfig,
  refresh,
  resolvedTableConfig,
  sizing,
}: {
  activePageSize: Readonly<Ref<number>>
  applyResolvedTableConfig: (api: GridApi<Row>) => void
  emitSort: (sort: TableDataGridSort) => void
  getGridConfig: (api: GridApi<Row>) => TableDataGridConfig
  gridApi: Ref<GridApi<Row> | undefined>
  mode: Readonly<Ref<TableDataGridMode>>
  patchTableConfig: (config: Partial<TableDataGridConfig>) => void
  refresh: (params?: Partial<TableDataGridSort & { pageSize: number }>) => void
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
  sizing: TableDataGridConfigSyncSizingHandlers<Row>
}) => {
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

    const didColumnVisibilityChange = hasColumnVisibilityChanged({
      nextConfig,
      previousConfig: gridConfig,
    })
    applyResolvedTableConfig(api)
    if (didColumnVisibilityChange) {
      sizing.scheduleColumnsToFitAfterDisplayedColumnsChange()
      return
    }

    if (sizing.shouldRefitColumnsAfterConfigChange()) {
      sizing.scheduleColumnsToFit({ persistFittedConfig: true })
    }
  })

  return {
    onPageSizeChange,
    onSortChange,
    refreshForConfigChange,
  }
}
