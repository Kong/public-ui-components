import type { TableDataGridHeader, TableDataGridRow, TableDataGridSort } from '../types'
import type { ColDef } from 'ag-grid-community'
import type { Ref, Slots } from 'vue'
import { computed } from 'vue'
import TableDataGridCellRenderer from '../components/TableDataGridCellRenderer.vue'

/**
 * Converts `headers` into what AG Grid needs to render the table's columns:
 * the column definitions themselves, and the shared grid `context`.
 */
export const useTableDataGridColumnDefs = <Row extends object = TableDataGridRow>({
  headers,
  slots,
  initialSort,
}: {
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  slots: Slots
  initialSort?: TableDataGridSort
}) => {
  // AG Grid's generic passthrough object, copied onto every cell/header renderer.
  const gridContext = computed(() => ({
    cells: { slots },
  }))

  const createColumnDef = (header: TableDataGridHeader<Row>): ColDef<Row> => {
    const isInitialSortColumn = initialSort?.sortColumnKey === header.key

    return {
      colId: header.key,
      // Columns with no explicit width constraint share remaining space equally.
      flex: !header.width && !header.maxWidth ? 1 : undefined,
      headerName: header.label,
      maxWidth: header.maxWidth,
      minWidth: header.minWidth,
      sortable: header.sortable ?? false,
      unSortIcon: header.showSortIcon,
      ...(isInitialSortColumn ? { initialSort: initialSort?.sortColumnOrder, initialSortIndex: 0 } : {}),
      valueGetter: params => params.data?.[header.key],
      width: header.width,
      cellRenderer: TableDataGridCellRenderer,
      // custom params passed to the cell renderer.
      cellRendererParams: { headerDef: header },
    }
  }

  const columnDefs = computed<Array<ColDef<Row>>>(() => headers.value.map(createColumnDef))

  return {
    columnDefs,
    gridContext,
  }
}
