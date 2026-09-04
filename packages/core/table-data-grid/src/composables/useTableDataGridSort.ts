import type { TableDataGridRow, TableDataGridSort, TableDataGridSortDirection } from '../types'
import type { GridApi, SortChangedEvent } from 'ag-grid-community'
import type { Ref } from 'vue'

/**
 * Translates AG Grid's `sortChanged` event into `TableDataGrid`'s `sort`
 * shape, and pushes a sort back onto the grid.
 *
 * @param activeSort Current resolved sort, read from `useTableDataGridConfig`.
 * @param emitSort Called with the new sort whenever a grid interaction changes it.
 * @param patchTableConfig Writes the new sort into the current `tableConfig`.
 */
export const useTableDataGridSort = <Row extends object = TableDataGridRow>({
  activeSort,
  emitSort,
  patchTableConfig,
}: {
  activeSort: Readonly<Ref<TableDataGridSort>>
  emitSort: (sort: TableDataGridSort) => void
  patchTableConfig: (patch: Partial<TableDataGridSort>) => void
}) => {
  const applySortToGrid = (api: GridApi<Row>, sort: TableDataGridSort) => {
    api.applyColumnState({
      state: sort.sortColumnKey
        ? [{ colId: sort.sortColumnKey, sort: sort.sortColumnOrder ?? null, sortIndex: 0 }]
        : [],
      defaultState: { sort: null, sortIndex: null },
    })
  }

  const onSortChanged = (event: SortChangedEvent<Row>) => {
    const sortedColumns = event.api.getColumnState()
      .filter(column => column.sort)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
    const latest = sortedColumns[sortedColumns.length - 1]

    const next: TableDataGridSort = latest
      ? { sortColumnKey: latest.colId, sortColumnOrder: latest.sort as TableDataGridSortDirection }
      : { sortColumnKey: undefined, sortColumnOrder: undefined }

    if (
      next.sortColumnKey === activeSort.value.sortColumnKey
      && next.sortColumnOrder === activeSort.value.sortColumnOrder
    ) {
      return
    }

    emitSort(next)
    patchTableConfig(next)

    // suppressMultiSort blocks the shift-click UI path; this is the
    // structural backstop for any other path that leaves >1 column sorted.
    if (sortedColumns.length > 1) {
      applySortToGrid(event.api, next)
    }
  }

  return { onSortChanged, applySortToGrid }
}
