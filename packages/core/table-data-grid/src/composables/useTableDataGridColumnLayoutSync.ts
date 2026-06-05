import type {
  TableDataGridMode,
  TableDataGridRowSelectionMode,
} from '../types'
import type {
  TableDataGridColumnLayoutSizingHandlers,
} from '../types/internal'
import type {
  ColumnResizedEvent,
  DisplayedColumnsChangedEvent,
  GridApi,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { ref, shallowRef, watch } from 'vue'
import { hasSelectionColumn } from '../utils/gridSync'

/**
 * Owns AG Grid layout-event classification.
 *
 * This composable keeps displayed column indexes current for renderers and asks
 * sizing to persist or refit after move, pin, visibility, resize, displayed
 * column, and infinite-row render events. It does not own tableConfig itself.
 */
export const useTableDataGridColumnLayoutSync = <Row extends Record<string, any>>({
  gridApi,
  isApplyingInitialColumnState,
  mode,
  rowSelection,
  sizing,
}: {
  gridApi: Ref<GridApi<Row> | undefined>
  isApplyingInitialColumnState: Readonly<Ref<boolean>>
  mode: Readonly<Ref<TableDataGridMode>>
  rowSelection: Readonly<Ref<TableDataGridRowSelectionMode>>
  sizing: TableDataGridColumnLayoutSizingHandlers<Row>
}) => {
  const displayedColumnIndexesByKey = shallowRef(new Map<string, number>())
  const isRowSelectionColumnRefitPending = ref(false)

  const updateDisplayedColumnIndexes = (api = gridApi.value) => {
    displayedColumnIndexesByKey.value = api
      ? new Map(api.getAllDisplayedColumns().map((column, index) => [column.getColId(), index]))
      : new Map()
  }

  const onColumnPinned = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    sizing.persistGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
  }

  const onColumnLayoutChange = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    sizing.persistGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
  }

  const onColumnVisibilityChange = (event?: { api?: GridApi<Row> }) => {
    updateDisplayedColumnIndexes(event?.api)
    sizing.persistGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })
    if (isApplyingInitialColumnState.value) {
      return
    }

    sizing.scheduleColumnsToFitAfterDisplayedColumnsChange()
  }

  const onDisplayedColumnsChange = (event: DisplayedColumnsChangedEvent<Row>) => {
    updateDisplayedColumnIndexes(event.api)
    if (!isRowSelectionColumnRefitPending.value) {
      return
    }

    isRowSelectionColumnRefitPending.value = false
    sizing.scheduleColumnsToFitAfterDisplayedColumnsChange(event.api)
  }

  const onModelUpdated = (event: { api: GridApi<Row> }) => {
    if (mode.value !== 'infinite' || event.api.getDisplayedRowCount() === 0) {
      return
    }

    sizing.scheduleColumnsToFitAfterRenderedRowsChange(event.api)
  }

  const onColumnResize = (event: ColumnResizedEvent<Row>) => {
    // sizeColumnsToFit emits resize events for our own fitting writes; only user
    // resize completions should persist column widths into tableConfig.
    if (event.source !== 'sizeColumnsToFit' && event.finished !== false) {
      sizing.persistGridConfigChange()
    }
  }

  watch(() => rowSelection.value, (nextSelectionMode, previousSelectionMode) => {
    if (hasSelectionColumn(nextSelectionMode) === hasSelectionColumn(previousSelectionMode)) {
      return
    }

    isRowSelectionColumnRefitPending.value = true
  })

  return {
    displayedColumnIndexesByKey,
    isRowSelectionColumnRefitPending,
    onColumnLayoutChange,
    onColumnPinned,
    onColumnResize,
    onColumnVisibilityChange,
    onDisplayedColumnsChange,
    onModelUpdated,
    updateDisplayedColumnIndexes,
  }
}
