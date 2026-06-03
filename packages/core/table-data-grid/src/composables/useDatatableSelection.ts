import type {
  TableDataGridGridOptions,
} from '../types'
import type {
  TableDataGridSelectionConfig,
  TableDataGridSelectionEmit,
  TableDataGridSelectionGrid,
} from '../types/internal'
import type {
  ColDef,
  RowNode,
  RowSelectionOptions,
} from 'ag-grid-community'
import { computed, shallowRef } from 'vue'
import isEqual from 'lodash-es/isEqual'
import xor from 'lodash-es/xor'
import TableDataGridSelectionCell from '../components/TableDataGridSelectionCell.vue'
import TableDataGridSelectionHeader from '../components/TableDataGridSelectionHeader.vue'
import { getRowKeyValue } from '../utils/rowKey'

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

export const useDatatableSelection = <Row extends Record<string, any>>({
  config,
  emit,
  grid,
}: {
  config: TableDataGridSelectionConfig<Row>
  emit: TableDataGridSelectionEmit<Row>
  grid: TableDataGridSelectionGrid<Row>
}) => {
  const {
    agGridOptions,
    rowKey,
    rowSelection,
  } = config
  const {
    gridApi,
  } = grid
  const selectedRows = shallowRef<Row[]>([])
  const selectedRowKeys = shallowRef<string[]>([])

  const getRowKey = (row: Row): string => getRowKeyValue(row, rowKey.value)

  const rowSelectionConfig = computed<RowSelectionOptions | undefined>(() => {
    const selectionMode = rowSelection.value
    if (selectionMode === 'none') {
      return undefined
    }

    return {
      mode: selectionMode === 'multiple' ? 'multiRow' : 'singleRow',
      checkboxes: false,
      enableClickSelection: true,
      ...(selectionMode === 'multiple'
        ? {
          headerCheckbox: false,
        }
        : {}),
    }
  })

  const selectionColumnDef = computed<ColDef<Row> | undefined>(() => {
    const options = agGridOptions.value
    const selectionMode = rowSelection.value

    if (selectionMode !== 'multiple') {
      return undefined
    }

    const selectionColumnOptions = createSelectionColumnOptions(options.selectionColumnDef)
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
  })

  const selectRowByKey = (key: string) => {
    if (!gridApi.value) {
      return
    }

    const node = gridApi.value.getRowNode(key)
    if (node) {
      node.setSelected(true, true)
    }
  }

  const deselectAll = () => {
    gridApi.value?.deselectAll()
  }

  const onSelectionChange = () => {
    if (!gridApi.value) {
      return
    }

    const nextSelectedRows = gridApi.value.getSelectedRows()
    const nextSelectedRowKeys = nextSelectedRows.map(getRowKey)
    const previousSelectedRowKeys = selectedRowKeys.value
    if (isEqual(nextSelectedRowKeys, previousSelectedRowKeys)) {
      return
    }

    const changedRowNodes = xor(previousSelectedRowKeys, nextSelectedRowKeys)
      .map(key => gridApi.value?.getRowNode(key))
      .filter((node): node is RowNode<Row> => node != null)

    selectedRows.value = nextSelectedRows
    selectedRowKeys.value = nextSelectedRowKeys
    gridApi.value.refreshCells({
      ...(changedRowNodes.length ? { rowNodes: changedRowNodes } : {}),
      force: true,
    })
    emit.rowSelect(nextSelectedRows)
  }

  return {
    selectedRows,
    rowSelectionConfig,
    selectionColumnDef,
    selectRowByKey,
    deselectAll,
    onSelectionChange,
  }
}
