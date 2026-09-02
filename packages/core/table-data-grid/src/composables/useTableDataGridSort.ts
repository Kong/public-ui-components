import type { TableDataGridRow, TableDataGridSort, TableDataGridSortDirection } from '../types'
import type { GridApi, SortChangedEvent } from 'ag-grid-community'
import type { Ref } from 'vue'

/**
 * Translates AG Grid's `sortChanged` event into `TableDataGrid`'s
 * package-owned `sort` shape, and pushes a host- or package-driven sort
 * back onto the grid.
 *
 * A grid-driven event is only acted on when it actually changes the
 * current sort — comparing against `activeSort` (rather than a mutable
 * re-entrancy flag) makes this idempotent, so it also absorbs the echo
 * `sortChanged` event that `applySortToGrid`'s own `applyColumnState` call
 * fires.
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

    // Explicit undefined, not {}, so patchTableConfig's spread merge actually clears the sort.
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
