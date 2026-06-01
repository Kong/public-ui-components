import type { ColDef, GridOptions } from 'ag-grid-community'
import type { Filter, FilterGroupFilters, FilterGroupSelection } from '@kong/kongponents'

export type TableDataGridMode = 'pagination' | 'infinite'

export type TableDataGridSortColumnOrder = 'asc' | 'desc'

export type TableDataGridSort = {
  sortColumnKey?: string
  sortColumnOrder?: TableDataGridSortColumnOrder
}

export type TableDataGridPinnedState = 'left' | 'right' | false

export type TableDataGridState = 'loading' | 'error' | 'success' | 'empty'

export type TableDataGridStatePayload = {
  state: TableDataGridState
  hasData: boolean
}

export type TableDataGridTeleportTarget = string | HTMLElement

export type TableDataGridToolbarSlotProps<Row extends Record<string, any> = Record<string, any>> = {
  selectedRows: Row[]
  filterSelection: FilterGroupSelection
  filters: FilterGroupFilters
  search: string
  updateFilterSelection: (selection: FilterGroupSelection) => void
  updateSearch: (search: string) => void
  refresh: () => void
}

export type TableDataGridConfig = {
  columnOrder?: string[]
  columnVisibility?: Record<string, boolean>
  columnWidths?: Record<string, number>
  pinnedColumns?: Record<string, TableDataGridPinnedState>
  sortColumnKey?: string
  sortColumnOrder?: TableDataGridSortColumnOrder
  pageSize?: number
}

export type TableDataGridHeader<Row extends Record<string, any> = Record<string, any>> = {
  key: string
  label: string
  sortable?: boolean
  hideable?: boolean
  hideLabel?: boolean
  disableRowClick?: boolean
  tooltip?: string
  width?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  draggable?: boolean
  pinned?: TableDataGridPinnedState
  filter?: Filter
  // Escape hatch for lower-level AG Grid behavior; these options can override
  // package defaults and bypass table-data-grid guarantees, so treat them as
  // opt-in risk rather than a supported extension point.
  agGridColumnOptions?: Partial<ColDef<Row>>
}

export type TableDataGridFetcherParams = {
  mode: TableDataGridMode
  page?: number
  pageSize: number
  startRow?: number
  endRow?: number
  cursor?: any
  sortColumnKey?: string
  sortColumnOrder?: TableDataGridSortColumnOrder
  search?: string
  filterSelection?: FilterGroupSelection
}

export type TableDataGridFetcherResult<Row extends Record<string, any> = Record<string, any>> = {
  data: Row[]
  // Known total row count for pagination or finite infinite scroll datasets.
  total?: number
  // Cursor for the next sequential infinite request. `undefined` is valid when
  // the dataset advances by offset or another external positional contract.
  cursor?: any
  // Explicit next-page signal when the host can determine whether more rows
  // exist without relying on `total` or the returned block length.
  hasMore?: boolean
}

export type TableDataGridFetcher<Row extends Record<string, any> = Record<string, any>> = (
  params: TableDataGridFetcherParams,
) => Promise<TableDataGridFetcherResult<Row>>

export type TableDataGridRowSelectionMode = 'none' | 'single' | 'multiple'

// Row identity field used by AG Grid selection and row id handling. The field
// should be unique and stable for each logical row while it is rendered.
export type TableDataGridRowKey<Row extends Record<string, any> = Record<string, any>> = Extract<keyof Row, string>

export type TableDataGridCellSlotProps<Row extends Record<string, any> = Record<string, any>> = {
  row: Row
  rowValue: any
  column: TableDataGridHeader<Row>
  rowIndex: number
  refreshCell: () => void
  selected: boolean
}

// Row attribute hook is intentionally broad: `class` may be a string, string
// array, or object map; `style` should be an object; all other keys map to DOM
// attributes on the rendered row element.
export type TableDataGridRowAttrs<Row extends Record<string, any> = Record<string, any>> = (
  row: Row,
) => Record<string, unknown>

export type TableDataGridCellAttrs<Row extends Record<string, any> = Record<string, any>> = (
  params: {
    row: Row
    rowValue: any
    column: TableDataGridHeader<Row>
    rowIndex: number
    colIndex: number
  },
) => Record<string, unknown>

// AG Grid options are an intentional escape hatch for consumers that need
// lower-level control; they can override package defaults and guarantees, so
// datasource and row-model behavior may be affected by design.
export type TableDataGridGridOptions<Row extends Record<string, any> = Record<string, any>> = GridOptions<Row>
