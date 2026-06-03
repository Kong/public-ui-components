import type {
  TableDataGridCellAttrs,
  TableDataGridConfig,
  TableDataGridFetcher,
  TableDataGridFetcherParams,
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridRowKey,
  TableDataGridRowSelectionMode,
} from './index'
import type { ColDef, GridApi } from 'ag-grid-community'
import type { Ref, ShallowRef, Slots } from 'vue'

export type GridColumnWidthChangeSource = 'intentional' | 'layout-side-effect'

export type TableDataGridConfigSources<Row extends Record<string, any>> = {
  emitTableConfigUpdate: (config: TableDataGridConfig) => void
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  pageSize: Readonly<Ref<number>>
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
}

export type TableDataGridFetchSource<Row extends Record<string, any>> = {
  fetcher: Readonly<Ref<TableDataGridFetcher<Row>>>
}

export type TableDataGridFetchParams = {
  filterSelection: Readonly<Ref<TableDataGridFetcherParams['filterSelection']>>
  mode: Readonly<Ref<TableDataGridFetcherParams['mode']>>
  pageSize: Readonly<Ref<TableDataGridFetcherParams['pageSize']>>
  search: Readonly<Ref<TableDataGridFetcherParams['search']>>
  sortColumnKey: Readonly<Ref<TableDataGridFetcherParams['sortColumnKey']>>
  sortColumnOrder: Readonly<Ref<TableDataGridFetcherParams['sortColumnOrder']>>
}

export type TableDataGridSelectionConfig<Row extends Record<string, any>> = {
  agGridOptions: Readonly<Ref<TableDataGridGridOptions<Row>>>
  rowKey: Readonly<Ref<TableDataGridRowKey<Row>>>
  rowSelection: Readonly<Ref<TableDataGridRowSelectionMode>>
}

export type TableDataGridSelectionEmit<Row extends Record<string, any>> = {
  rowSelect: (selectedRows: Row[]) => void
}

export type TableDataGridSelectionGrid<Row extends Record<string, any>> = {
  gridApi: Ref<GridApi<Row> | undefined>
}

export type TableDataGridColumnSizingConfig<Row extends Record<string, any>> = {
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  isApplyingTableConfig: Readonly<Ref<boolean>>
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
  updateTableConfig: (config: Partial<TableDataGridConfig>) => void
}

export type TableDataGridColumnSizingElement = {
  datatableElement: Readonly<Ref<HTMLElement | undefined>>
  datatableWidth: Readonly<Ref<number>>
}

export type TableDataGridColumnSizingGrid<Row extends Record<string, any>> = {
  getGridConfig: (api: GridApi<Row>) => TableDataGridConfig
  gridApi: Ref<GridApi<Row> | undefined>
}

export type TableDataGridColumnSizingHandlers<Row extends Record<string, any>> = {
  emitGridConfigChange: (options?: {
    columnWidthChangeSource?: GridColumnWidthChangeSource
  }) => void
  fitColumnsOnGridReady: (api: GridApi<Row>) => void
  handleDatatableWidthChange: () => void
  scheduleColumnsToFit: (options?: {
    api?: GridApi<Row>
    persistFittedConfig?: boolean
    honorConfiguredColumnWidths?: boolean
  }) => void
  scheduleColumnsToFitAfterDisplayedColumnsChange: (api?: GridApi<Row>) => void
  scheduleColumnsToFitAfterRenderedRowsChange: (api?: GridApi<Row>) => void
  shouldRefitColumnsAfterConfigChange: () => boolean
  startResizeTracking: () => void
}

export type TableDataGridColumnDefsConfig<Row extends Record<string, any>> = {
  cellAttrs: Readonly<Ref<TableDataGridCellAttrs<Row> | undefined>>
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
}

export type TableDataGridColumnDefsGrid = {
  displayedColumnIndexesByKey: Readonly<ShallowRef<Map<string, number>>>
}

export type TableDataGridColumnDefsSelection<Row extends Record<string, any>> = {
  selectionColumnDef: Readonly<Ref<ColDef<Row> | undefined>>
}

export type TableDataGridColumnDefsSlots = {
  slots: Slots
}
