import type {
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridRowSelectionMode,
} from '../types'
import type {
  TableDataGridColumnDefsConfig,
  TableDataGridColumnDefsGrid,
  TableDataGridColumnDefsSlots,
} from '../types/internal'
import type { ColDef } from 'ag-grid-community'
import { computed } from 'vue'
import isEqual from 'lodash-es/isEqual'
import TableDataGridCellRenderer from '../components/TableDataGridCellRenderer.vue'
import TableDataGridHeaderRenderer from '../components/TableDataGridHeaderRenderer.vue'
import TableDataGridSelectionCell from '../components/TableDataGridSelectionCell.vue'
import TableDataGridSelectionHeader from '../components/TableDataGridSelectionHeader.vue'
import { isColumnHideable } from '../utils/headers'

const SELECTION_COLUMN_ID = 'ag-Grid-SelectionColumn'
const SELECTION_COLUMN_WIDTH_PX = 48

type StaticSelectionColumnClass = string | string[]
type StaticSelectionColumnStyle = Record<string, string | number>

type SelectionColumnHostOptions<Row extends Record<string, any>> = Pick<ColDef<Row>,
  | 'flex'
  | 'headerName'
  | 'headerTooltip'
  | 'initialFlex'
  | 'initialWidth'
  | 'maxWidth'
  | 'minWidth'
  | 'suppressAutoSize'
  | 'suppressSizeToFit'
  | 'width'
> & {
  cellClass?: StaticSelectionColumnClass
  cellStyle?: StaticSelectionColumnStyle
  headerClass?: StaticSelectionColumnClass
  headerStyle?: StaticSelectionColumnStyle
}

const createSelectionColumnOptions = <Row extends Record<string, any>>(
  selectionColumnDef: TableDataGridGridOptions<Row>['selectionColumnDef'] = {},
): Partial<SelectionColumnHostOptions<Row>> => {
  const {
    cellClass,
    cellStyle,
    flex,
    headerClass,
    headerName,
    headerStyle,
    headerTooltip,
    initialFlex,
    initialWidth,
    maxWidth,
    minWidth,
    suppressAutoSize,
    suppressSizeToFit,
    width,
  } = selectionColumnDef

  const options: Partial<SelectionColumnHostOptions<Row>> = {
    flex,
    headerName,
    headerTooltip,
    initialFlex,
    initialWidth,
    maxWidth,
    minWidth,
    suppressAutoSize,
    suppressSizeToFit,
    width,
  }

  if (cellClass && typeof cellClass !== 'function') {
    options.cellClass = cellClass as SelectionColumnHostOptions<Row>['cellClass']
  }
  if (cellStyle && typeof cellStyle !== 'function') {
    options.cellStyle = cellStyle as SelectionColumnHostOptions<Row>['cellStyle']
  }
  if (headerClass && typeof headerClass !== 'function') {
    options.headerClass = headerClass as SelectionColumnHostOptions<Row>['headerClass']
  }
  if (headerStyle && typeof headerStyle !== 'function') {
    options.headerStyle = headerStyle as SelectionColumnHostOptions<Row>['headerStyle']
  }

  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as Partial<SelectionColumnHostOptions<Row>>
}

const createSelectionColumnDef = <Row extends Record<string, any>>({
  agGridOptions,
  rowSelection,
}: {
  agGridOptions: TableDataGridGridOptions<Row>
  rowSelection: TableDataGridRowSelectionMode
}): ColDef<Row> | undefined => {
  if (rowSelection !== 'multiple') {
    return undefined
  }

  const selectionColumnOptions = createSelectionColumnOptions(agGridOptions.selectionColumnDef)
  const width = selectionColumnOptions.width ?? SELECTION_COLUMN_WIDTH_PX
  const minWidth = selectionColumnOptions.minWidth ?? SELECTION_COLUMN_WIDTH_PX
  const maxWidth = selectionColumnOptions.maxWidth ?? Math.max(width, minWidth, SELECTION_COLUMN_WIDTH_PX)

  return {
    ...selectionColumnOptions,
    cellRenderer: TableDataGridSelectionCell,
    colId: SELECTION_COLUMN_ID,
    headerComponent: TableDataGridSelectionHeader,
    lockPosition: 'left',
    maxWidth,
    minWidth,
    pinned: 'left',
    resizable: false,
    sortable: false,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    width,
  }
}

export const useDatatableColumnDefs = <Row extends Record<string, any>>({
  config,
  grid,
  slots,
}: {
  config: TableDataGridColumnDefsConfig<Row>
  grid: TableDataGridColumnDefsGrid
  slots: TableDataGridColumnDefsSlots
}) => {
  const {
    agGridOptions,
    cellAttrs,
    headers,
    resolvedTableConfig,
    rowSelection,
  } = config
  const {
    displayedColumnIndexesByKey,
  } = grid
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

  const selectionColumnDef = computed<ColDef<Row> | undefined>(() => createSelectionColumnDef({
    agGridOptions: agGridOptions.value,
    rowSelection: rowSelection.value,
  }))

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
