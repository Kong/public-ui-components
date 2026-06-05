import type {
  TableDataGridCellAttrs,
  TableDataGridConfig,
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridRowSelectionMode,
} from '../types'
import type {
  TableDataGridSelectionRendererContext,
} from '../types/internal'
import type { ColDef } from 'ag-grid-community'
import type { Ref, Slots } from 'vue'
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

type SelectionColumnHostOptions<Row extends Record<string, any>> = {
  cellClass?: StaticSelectionColumnClass
  cellStyle?: StaticSelectionColumnStyle
  flex?: ColDef<Row>['flex']
  headerClass?: StaticSelectionColumnClass
  headerName?: ColDef<Row>['headerName']
  headerStyle?: StaticSelectionColumnStyle
  headerTooltip?: ColDef<Row>['headerTooltip']
  initialFlex?: ColDef<Row>['initialFlex']
  initialWidth?: ColDef<Row>['initialWidth']
  maxWidth?: ColDef<Row>['maxWidth']
  minWidth?: ColDef<Row>['minWidth']
  suppressAutoSize?: ColDef<Row>['suppressAutoSize']
  suppressSizeToFit?: ColDef<Row>['suppressSizeToFit']
  width?: ColDef<Row>['width']
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

/**
 * Owns AG Grid column definition creation.
 *
 * Headers and resolved tableConfig are the sources of truth for table columns.
 * The returned `gridContext` is the only internal bridge AG Grid renderers use
 * to access cell, selection, and sort behavior without reaching into the parent.
 */
export const useTableDataGridColumnDefs = <Row extends Record<string, any>>({
  agGridOptions,
  cellAttrs,
  displayedColumnIndexesByKey,
  headers,
  resolvedTableConfig,
  rowSelection,
  selectionRendererContext,
  slots,
}: {
  agGridOptions: Readonly<Ref<TableDataGridGridOptions<Row>>>
  cellAttrs: Readonly<Ref<TableDataGridCellAttrs<Row> | undefined>>
  displayedColumnIndexesByKey: Readonly<Ref<Map<string, number>>>
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  resolvedTableConfig: Readonly<Ref<TableDataGridConfig>>
  rowSelection: Readonly<Ref<TableDataGridRowSelectionMode>>
  selectionRendererContext: TableDataGridSelectionRendererContext<Row>
  slots: Slots
}) => {
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
  const currentSort = computed(() => ({
    sortColumnKey: resolvedTableConfig.value.sortColumnKey,
    sortColumnOrder: resolvedTableConfig.value.sortColumnOrder,
  }))
  const gridContext = computed(() => ({
    cells: {
      cellAttrs: cellAttrs.value,
      columnsByKey: columnsByKey.value,
      displayedColumnIndexesByKey,
      slots,
    },
    selection: selectionRendererContext,
    sort: {
      currentSort,
      requestSort: ({
        multiSort,
        progressSort,
      }: {
        multiSort: boolean
        progressSort: (multiSort?: boolean) => void
      }) => progressSort(multiSort),
    },
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
