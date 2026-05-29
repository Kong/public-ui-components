import type {
  TableDataGridGridOptions,
  TableDataGridRowKey,
  TableDataGridRowSelectionMode,
} from '../types'
import type {
  GridApi,
  RowNode,
  RowSelectionOptions,
  SelectionColumnDef,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, shallowRef } from 'vue'
import isEqual from 'lodash-es/isEqual'
import xor from 'lodash-es/xor'
import { getRowKeyValue } from '../utils/rowKey'

const SELECTION_COLUMN_WIDTH_PX = 48

export const useDatatableSelection = <Row extends Record<string, any>>({
  gridApi,
  rowSelection,
  agGridOptions,
  rowKey,
  emitRowSelect,
}: {
  gridApi: Readonly<Ref<GridApi<Row> | undefined>>
  rowSelection: Readonly<Ref<TableDataGridRowSelectionMode>>
  agGridOptions: Readonly<Ref<TableDataGridGridOptions<Row>>>
  rowKey: Readonly<Ref<TableDataGridRowKey<Row>>>
  emitRowSelect: (selectedRows: Row[]) => void
}) => {
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
      checkboxes: selectionMode === 'multiple',
      enableClickSelection: true,
    }
  })

  const selectionColumnDef = computed<SelectionColumnDef | undefined>(() => {
    const options = agGridOptions.value
    const selectionMode = rowSelection.value

    if (selectionMode !== 'multiple') {
      return undefined
    }

    return {
      ...options.selectionColumnDef,
      maxWidth: options.selectionColumnDef?.maxWidth ?? SELECTION_COLUMN_WIDTH_PX,
      minWidth: options.selectionColumnDef?.minWidth ?? SELECTION_COLUMN_WIDTH_PX,
      pinned: 'left',
      width: options.selectionColumnDef?.width ?? SELECTION_COLUMN_WIDTH_PX,
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
    selectedRows.value = []
    selectedRowKeys.value = []
    emitRowSelect([])
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
    emitRowSelect(nextSelectedRows)
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
