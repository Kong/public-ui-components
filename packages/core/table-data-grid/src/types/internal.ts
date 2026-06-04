import type {
  TableDataGridCellAttrs,
  TableDataGridConfig,
  TableDataGridFetcher,
  TableDataGridFetcherParams,
  TableDataGridHeader,
  TableDataGridSort,
} from './index'
import type { GridApi, IDatasource, RowNode } from 'ag-grid-community'
import type { Ref, ShallowRef, Slots } from 'vue'

export type GridColumnWidthChangeSource = 'intentional' | 'layout-side-effect'

export type TableDataGridConfigSources<Row extends Record<string, any>> = {
  emitTableConfigUpdate: (config: TableDataGridConfig) => void
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  pageSize: Readonly<Ref<number>>
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
}

type TableDataGridFetchSource<Row extends Record<string, any>> = {
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

type TableDataGridFetchState<Row extends Record<string, any>> = {
  currentPage: Ref<number>
  datasource: Ref<IDatasource | undefined>
  fetchError: Ref<unknown>
  hasFetched: Ref<boolean>
  hasNextPageWhenTotalUnknown: Ref<boolean>
  markFetchFinished: (options?: { markFetched?: boolean }) => void
  markFetchStarted: () => void
  resetFetched: () => void
  rowData: ShallowRef<Row[]>
  totalRows: Ref<number | undefined>
}

export type TableDataGridFetchModeSources<Row extends Record<string, any>> = {
  fetcher: TableDataGridFetchSource<Row>['fetcher']
  params: TableDataGridFetchParams
  state: TableDataGridFetchState<Row>
}

export type TableDataGridSelectionRendererState = {
  selected: boolean
  selectable: boolean
}

export type TableDataGridSelectionHeaderRendererState = {
  checked: boolean
  disabled: boolean
  indeterminate: boolean
}

export type TableDataGridSelectionRendererContext<Row extends Record<string, any>> = {
  getHeaderSelectionState: (api: GridApi<Row>) => TableDataGridSelectionHeaderRendererState
  getRowSelectionState: (node: RowNode<Row>) => TableDataGridSelectionRendererState
  setAllRowsSelected: (options: {
    api: GridApi<Row>
    selected: boolean
  }) => void
  setRowSelected: (options: {
    node: RowNode<Row>
    selected: boolean
  }) => void
  subscribeToHeaderSelectionState: (options: {
    api: GridApi<Row>
    onChange: () => void
  }) => () => void
}

export type TableDataGridColumnSizingHandlers<Row extends Record<string, any>> = {
  persistGridConfigChange: (options?: {
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

type TableDataGridCellRendererContext<Row extends Record<string, any>> = {
  cellAttrs?: TableDataGridCellAttrs<Row>
  columnsByKey: Map<string, TableDataGridHeader<Row>>
  displayedColumnIndexesByKey: Readonly<Ref<Map<string, number>>>
  slots: Slots
}

type TableDataGridSortRendererContext = {
  currentSort: Readonly<Ref<TableDataGridSort>>
  requestSort: (options: {
    multiSort: boolean
    progressSort: (multiSort?: boolean) => void
  }) => void
}

export type TableDataGridRendererContext<Row extends Record<string, any>> = {
  cells: TableDataGridCellRendererContext<Row>
  selection: TableDataGridSelectionRendererContext<Row>
  sort: TableDataGridSortRendererContext
}
