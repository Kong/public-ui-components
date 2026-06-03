import type { TableDataGridHeader } from '../types'
import type {
  TableDataGridColumnDefsConfig,
  TableDataGridColumnDefsGrid,
  TableDataGridColumnDefsSelection,
  TableDataGridColumnDefsSlots,
} from '../types/internal'
import type { ColDef } from 'ag-grid-community'
import { computed } from 'vue'
import isEqual from 'lodash-es/isEqual'
import TableDataGridCellRenderer from '../components/TableDataGridCellRenderer.vue'
import TableDataGridHeaderRenderer from '../components/TableDataGridHeaderRenderer.vue'
import { isColumnHideable } from '../utils/headers'

export const useDatatableColumnDefs = <Row extends Record<string, any>>({
  config,
  grid,
  selection,
  slots,
}: {
  config: TableDataGridColumnDefsConfig<Row>
  grid: TableDataGridColumnDefsGrid
  selection: TableDataGridColumnDefsSelection<Row>
  slots: TableDataGridColumnDefsSlots
}) => {
  const {
    cellAttrs,
    headers,
    resolvedTableConfig,
  } = config
  const {
    displayedColumnIndexesByKey,
  } = grid
  const {
    selectionColumnDef,
  } = selection
  const {
    slots: componentSlots,
  } = slots
  const resolvedHeaders = computed(() => headers.value)
  const columnsByKey = computed(() => new Map(resolvedHeaders.value.map(header => [header.key, header])))
  const columnOrder = computed<string[]>((previous) => {
    const nextColumnOrder = resolvedTableConfig.value.columnOrder ?? []
    // AG Grid resets column layout when it receives a new columnDefs array.
    // Preserve the previous order reference when the resolved order is unchanged.
    return previous && isEqual(previous, nextColumnOrder) ? previous : nextColumnOrder
  })

  const getColumnHeaderName = (header: TableDataGridHeader<Row>) => header.hideLabel ? '' : header.label
  const orderedHeaders = computed(() => {
    return columnOrder.value
      .map(key => columnsByKey.value.get(key))
      .filter((header): header is TableDataGridHeader<Row> => Boolean(header))
  })
  const gridContext = computed(() => ({
    cellAttrs: cellAttrs.value,
    columnsByKey: columnsByKey.value,
    displayedColumnIndexesByKey,
    slots: componentSlots,
  }))

  const createColumnDef = (header: TableDataGridHeader<Row>): ColDef<Row> => ({
    headerName: getColumnHeaderName(header),
    colId: header.key,
    headerComponent: TableDataGridHeaderRenderer,
    // AG Grid initial-state fields seed defaults; persisted tableConfig is
    // applied later with applyColumnState so user changes remain controlled.
    initialWidth: header.width,
    lockVisible: !isColumnHideable(header),
    maxWidth: header.maxWidth,
    minWidth: header.minWidth,
    initialPinned: header.pinned ?? false,
    resizable: header.resizable ?? true,
    sortable: header.sortable ?? false,
    suppressMovable: header.draggable === false,
    tooltipValueGetter: params => header.tooltip ?? String(params.value ?? ''),
    valueGetter: params => params.data?.[header.key],
    cellRenderer: TableDataGridCellRenderer,
    ...header.agGridColumnOptions,
  })

  const columnDefs = computed<Array<ColDef<Row>>>(() => {
    const tableColumnDefs = orderedHeaders.value.map(createColumnDef)

    return selectionColumnDef.value
      ? [selectionColumnDef.value, ...tableColumnDefs]
      : tableColumnDefs
  })

  return {
    gridContext,
    columnDefs,
  }
}
