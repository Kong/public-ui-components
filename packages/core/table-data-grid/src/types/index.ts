import type { GridApi, GridOptions } from 'ag-grid-community'

export type TableDataGridMode = 'infinite'

export type TableDataGridHeader<Row extends object = Record<string, unknown>> = {
  key: Extract<keyof Row, string>
  label: string
  width?: number
  minWidth?: number
  maxWidth?: number
}

type TableDataGridCursorParams = {
  cursor?: unknown
  offset?: never
}

type TableDataGridOffsetParams = {
  cursor?: never
  offset?: number
}

export type TableDataGridFetcherParams = {
  mode: TableDataGridMode
  pageSize: number
} & (TableDataGridCursorParams | TableDataGridOffsetParams)

export type TableDataGridFetcherResult<Row extends object = Record<string, unknown>> = {
  data: Row[]
  total?: number
}

export type TableDataGridFetcher<Row extends object = Record<string, unknown>> = (
  params: TableDataGridFetcherParams,
) => Promise<TableDataGridFetcherResult<Row>>

export type TableDataGridGridOptions<Row extends object = Record<string, unknown>> = GridOptions<Row>

export type TableDataGridReadyPayload<Row extends object = Record<string, unknown>> = GridApi<Row>
