import type {
  TableDataGridCellClickPayload,
  TableDataGridHeader,
  TableDataGridRow,
  TableDataGridRowClickPayload,
} from '../types'
import type { CellClickedEvent, RowClickedEvent } from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed } from 'vue'

/**
 * Converts AG Grid's row and cell click events into `TableDataGrid`'s own
 * row/cell interaction handlers, and governs how those interactions behave
 * (e.g. suppressing row clicks for columns marked `disableRowClick`).
 */
export const useTableDataGridInteractions = <Row extends object = TableDataGridRow>({
  cellClick,
  headers,
  rowClick,
}: {
  cellClick: (payload: TableDataGridCellClickPayload<Row>) => void
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  rowClick: (row: TableDataGridRowClickPayload<Row>, event: RowClickedEvent<Row>) => void
}) => {
  const rowClickDisabledColumnKeys = computed(() => new Set<string>(
    headers.value.filter(header => header.disableRowClick).map(header => header.key),
  ))

  // RowClickedEvent has no column API, so read col-id off the clicked DOM cell.
  const getClickedColumnKey = (event: RowClickedEvent<Row>): string | undefined => {
    const target = event.event?.target

    return target instanceof Element
      ? target.closest('.ag-cell')?.getAttribute('col-id') ?? undefined
      : undefined
  }

  const isRowClickDisabledForColumn = (event: RowClickedEvent<Row>): boolean => {
    const columnKey = getClickedColumnKey(event)

    return Boolean(columnKey && rowClickDisabledColumnKeys.value.has(columnKey))
  }

  const onRowClick = (event: RowClickedEvent<Row>) => {
    if (event.data && !isRowClickDisabledForColumn(event)) {
      rowClick(event.data, event)
    }
  }

  const onCellClick = (event: CellClickedEvent<Row>) => {
    const columnKey = event.colDef.colId

    if (!event.data || !columnKey) {
      return
    }

    cellClick({
      columnKey,
      row: event.data,
      value: event.value,
    })
  }

  return {
    onCellClick,
    onRowClick,
  }
}
