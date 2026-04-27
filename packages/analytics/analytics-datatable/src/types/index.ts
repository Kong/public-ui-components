import type { ColDef, GridOptions } from 'ag-grid-community'
import type { Filter, FilterGroupSelection } from '@kong/kongponents'

export type AnalyticsDatatableMode = 'pagination' | 'infinite'

export type AnalyticsDatatableSort = {
  key: string
  order: 'asc' | 'desc'
}

export type AnalyticsDatatablePinnedState = 'left' | 'right' | false

export type AnalyticsDatatableConfig = {
  columnOrder?: string[]
  columnVisibility?: Record<string, boolean>
  columnWidths?: Record<string, number>
  pinnedColumns?: Record<string, AnalyticsDatatablePinnedState>
  sort?: AnalyticsDatatableSort
  pageSize?: number
}

export type AnalyticsDatatableHeader<Row extends Record<string, any> = Record<string, any>> = {
  key: string
  label: string
  sortable?: boolean
  hideable?: boolean
  hideLabel?: boolean
  tooltip?: string
  width?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  draggable?: boolean
  pinned?: AnalyticsDatatablePinnedState
  filter?: Filter
  agGridColumnOptions?: Partial<ColDef<Row>>
}

export type AnalyticsDatatableFetcherParams = {
  mode: AnalyticsDatatableMode
  page?: number
  pageSize: number
  startRow?: number
  endRow?: number
  cursor?: any
  sort?: AnalyticsDatatableSort
  search?: string
  filterSelection?: FilterGroupSelection
}

export type AnalyticsDatatableFetcherResult<Row extends Record<string, any> = Record<string, any>> = {
  data: Row[]
  total?: number
  cursor?: any
  hasMore?: boolean
}

export type AnalyticsDatatableFetcher<Row extends Record<string, any> = Record<string, any>> = (
  params: AnalyticsDatatableFetcherParams,
) => Promise<AnalyticsDatatableFetcherResult<Row>>

export type AnalyticsDatatableRowSelectionMode = 'none' | 'single' | 'multiple'

export type AnalyticsDatatableRowKey<Row extends Record<string, any> = Record<string, any>> = Extract<keyof Row, string>

export type AnalyticsDatatableCellSlotProps<Row extends Record<string, any> = Record<string, any>> = {
  row: Row
  column: AnalyticsDatatableHeader<Row>
  rowIndex: number
  selected: boolean
}

// ag-Grid options are an intentional pass-through for consumers that need lower-level grid control.
export type AnalyticsDatatableGridOptions<Row extends Record<string, any> = Record<string, any>> = GridOptions<Row>
