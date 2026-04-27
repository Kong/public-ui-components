import type {
  AnalyticsDatatableGridOptions,
  AnalyticsDatatableRowKey,
  AnalyticsDatatableRowSelectionMode,
} from '../types'
import type {
  GridApi,
  RowNode,
  RowSelectionOptions,
  SelectionColumnDef,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, shallowRef } from 'vue'

const SELECTION_COLUMN_WIDTH_PX = 48

export const useDatatableSelection = <Row extends Record<string, any>>({
  gridApi,
  rowSelection,
  agGridOptions,
  rowKey,
  emitRowSelect,
}: {
  gridApi: Readonly<Ref<GridApi<Row> | undefined>>
  rowSelection: Readonly<Ref<AnalyticsDatatableRowSelectionMode>>
  agGridOptions: Readonly<Ref<AnalyticsDatatableGridOptions<Row>>>
  rowKey: Readonly<Ref<AnalyticsDatatableRowKey<Row>>>
  emitRowSelect: (selectedRows: Row[]) => void
}) => {
  const selectedRows = shallowRef<Row[]>([])
  const selectedRowKeys = shallowRef<string[]>([])

  const getRowKey = (row: Row): string => String(row[rowKey.value] ?? '')

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
    if (nextSelectedRowKeys.length === selectedRowKeys.value.length
      && nextSelectedRowKeys.every((key, index) => key === selectedRowKeys.value[index])) {
      return
    }

    const previousSelectedRowKeySet = new Set(selectedRowKeys.value)
    const nextSelectedRowKeySet = new Set(nextSelectedRowKeys)
    const changedRowNodes = Array.from(new Set([
      ...selectedRowKeys.value,
      ...nextSelectedRowKeys,
    ]))
      .filter(key => previousSelectedRowKeySet.has(key) !== nextSelectedRowKeySet.has(key))
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
