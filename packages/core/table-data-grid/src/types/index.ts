import type { GridApi } from 'ag-grid-community'

export type TableDataGridMode = 'infinite' | 'unpaginated'
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

export type TableDataGridThreshold = {
  value: number
  type: 'warning' | 'error'
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
  /** Formats the raw cell value for display. */
  valueFormatter?: (value: unknown, row: Row) => string
  /** Shows the row's share of the full returned column total. */
  showPercentage?: boolean
  /** Formats percentage points, e.g. 50 for a 50% share (not the 0–1 ratio). */
  percentageFormatter?: (percentage: number) => string
  /** Renders a bar using the column total or maximum as its denominator. */
  bar?: 'relative' | 'absolute'
  /**
   * Colors the bar when rendered, or the value text otherwise.
   * Compares the raw numeric value with each threshold independently of `bar`
   * and works in both infinite and unpaginated modes.
   */
  thresholds?: TableDataGridThreshold[]
}

export type TableDataGridSortDirection = 'asc' | 'desc'

export type TableDataGridSort = {
  sortColumnKey?: string
  sortColumnOrder?: TableDataGridSortDirection
}

export type TableDataGridConfig = TableDataGridSort & {
  pageSize?: number
}

export type TableDataGridProps<Row extends object = TableDataGridRow> = {
  headers: Array<TableDataGridHeader<Row>>
  error?: boolean
  tableConfig?: TableDataGridConfig
} & (
  | {
    fetcher: TableDataGridFetcher<Row>
    mode?: 'infinite'
    pageSize?: number
    refreshKey?: string | number | boolean
    rows?: never
  }
  | {
    /** Complete host-owned result rendered through AG Grid's client-side row model. */
    rows: Row[]
    mode: 'unpaginated'
    fetcher?: never
    pageSize?: never
    refreshKey?: never
  }
)

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
