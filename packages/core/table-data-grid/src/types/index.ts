import type { GridApi, SortModelItem, ValueFormatterFunc } from 'ag-grid-community'
import type { Component } from 'vue'

export type TableDataGridMode = 'infinite'
export type TableDataGridRow = Record<string, unknown>
export type TableDataGridState = 'loading' | 'success' | 'error'

export type TableDataGridStatePayload = {
  state: TableDataGridState
  hasData: boolean
}

export type TableDataGridRowClickPayload<Row extends object = TableDataGridRow> = Row

export type TableDataGridHeader<Row extends object = TableDataGridRow> = {
  key: Extract<keyof Row, string>
  label: string
  width?: number
  minWidth?: number
  maxWidth?: number
  /** Pins the column to the left or right edge of the grid. */
  pinned?: 'left' | 'right'
  /** Vue component used to render this column's cells. */
  cellRenderer?: Component
  /** Extra props passed to `cellRenderer`. */
  cellRendererParams?: Record<string, unknown>
  /** Formats the raw cell value for display. */
  valueFormatter?: ValueFormatterFunc<Row>
  /** Enables sorting UI for this column. The `fetcher` must apply `params.sort` server-side. */
  sortable?: boolean
}

export interface TableDataGridInfiniteFetcherParams {
  mode: 'infinite'
  pageSize: number
  cursor?: unknown
  sort?: SortModelItem[]
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
