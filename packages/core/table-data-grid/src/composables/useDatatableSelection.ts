import type {
  TableDataGridSelectionConfig,
  TableDataGridSelectionEmit,
  TableDataGridSelectionGrid,
} from '../types/internal'
import type {
  RowNode,
  RowSelectionOptions,
} from 'ag-grid-community'
import { computed, shallowRef } from 'vue'
import isEqual from 'lodash-es/isEqual'
import xor from 'lodash-es/xor'
import { getRowKeyValue } from '../utils/rowKey'

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
    selectRowByKey,
    deselectAll,
    onSelectionChange,
  }
}
