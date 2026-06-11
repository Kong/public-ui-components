import type { GridApi, GridOptions } from 'ag-grid-community'

export type TableDataGridMode = 'infinite'
export type TableDataGridRow = Record<string, unknown>

export type TableDataGridHeader<Row extends object = TableDataGridRow> = {
  key: Extract<keyof Row, string>
  label: string
  width?: number
  minWidth?: number
  maxWidth?: number
}

export interface TableDataGridInfiniteFetcherParams {
  mode: 'infinite'
  pageSize: number
  cursor?: unknown
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

export type TableDataGridGridOptions<Row extends object = TableDataGridRow> = GridOptions<Row>

export type TableDataGridReadyPayload<Row extends object = TableDataGridRow> = GridApi<Row>
