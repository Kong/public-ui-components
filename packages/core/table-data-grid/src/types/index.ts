import type { GridApi } from 'ag-grid-community'

export type TableDataGridMode = 'infinite'
export type TableDataGridRow = Record<string, unknown>
export type TableDataGridState = 'loading' | 'success' | 'error'

export type TableDataGridStatePayload = {
  state: TableDataGridState
  hasData: boolean
}

export type TableDataGridRowClickPayload<Row extends object = TableDataGridRow> = Row

export type TableDataGridCellClickPayload<Row extends object = TableDataGridRow> = {
  row: Row
  columnKey: string
  value: unknown
}

export type TableDataGridCellSlotProps<Row extends object = TableDataGridRow> = {
  row: Row
  rowValue: unknown
  column: TableDataGridHeader<Row>
  rowIndex: number
  selected: boolean
  /** Forces AG Grid to re-render this cell. */
  refreshCell: () => void
}

export type TableDataGridHeader<Row extends object = TableDataGridRow> = {
  key: Extract<keyof Row, string>
  label: string
  width?: number
  minWidth?: number
  maxWidth?: number
  /**
   * Disables the `row:click` emit for clicks landing inside this column's
   * cells, e.g. an actions column with its own buttons. AG Grid's own
   * selection/click mechanics are unaffected.
   */
  disableRowClick?: boolean
  /** Enables sorting on this column via AG Grid's built-in header sort control. */
  sortable?: boolean
  /**
   * Shows the unsorted sort icon on this column's header even when it isn't
   * the active sort, instead of only on hover or once sorted. Only relevant
   * when `sortable` is true.
   */
  showSortIcon?: boolean
}

export type TableDataGridSortDirection = 'asc' | 'desc'

export type TableDataGridSort = {
  sortColumnKey?: string
  sortColumnOrder?: TableDataGridSortDirection
}

export type TableDataGridConfig = TableDataGridSort & {
  pageSize?: number
}

export interface TableDataGridInfiniteFetcherParams {
  mode: 'infinite'
  pageSize: number
  cursor?: unknown
  sort?: TableDataGridSort
}

export type TableDataGridFetcherResult<Row extends object = TableDataGridRow> = {
  data: Row[]
  cursor?: unknown
  total?: number
  hasMore?: boolean
}

export type TableDataGridFetcher<Row extends object = TableDataGridRow> = (
  params: TableDataGridInfiniteFetcherParams,
) => Promise<TableDataGridFetcherResult<Row>>

export type TableDataGridReadyPayload<Row extends object = TableDataGridRow> = GridApi<Row>
