import type { TableDataGridHeader, TableDataGridRow } from '../types'
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
}: {
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  slots: Slots
}) => {
  // AG Grid's generic passthrough object, copied onto every cell/header renderer.
  const gridContext = computed(() => ({
    cells: { slots },
  }))

  const createColumnDef = (header: TableDataGridHeader<Row>): ColDef<Row> => ({
    colId: header.key,
    // Columns with no explicit width constraint share remaining space equally.
    flex: !header.width && !header.maxWidth ? 1 : undefined,
    headerName: header.label,
    maxWidth: header.maxWidth,
    minWidth: header.minWidth,
    valueGetter: params => params.data?.[header.key],
    width: header.width,
    cellRenderer: TableDataGridCellRenderer,
    // custom params passed to the cell renderer.
    cellRendererParams: { headerDef: header },
  })

  const columnDefs = computed<Array<ColDef<Row>>>(() => headers.value.map(createColumnDef))

  return {
    columnDefs,
    gridContext,
  }
}
