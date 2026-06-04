import type {
  TableDataGridSelectionHeaderRendererState,
  TableDataGridSelectionRendererState,
} from '../types/internal'
import type {
  TableDataGridRowKey,
  TableDataGridRowSelectionMode,
} from '../types'
import type {
  GridApi,
  RowNode,
  RowSelectionOptions,
} from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, shallowRef } from 'vue'
import isEqual from 'lodash-es/isEqual'
import xor from 'lodash-es/xor'
import { getRowKeyValue } from '../utils/rowKey'

/**
 * Owns row-selection integration with AG Grid.
 *
 * AG Grid is the immediate source of selected row state. This composable mirrors
 * selected rows/keys for table chrome and emits, exposes public selection
 * methods, and provides the only context selection renderers can call.
 */
export const useTableDataGridSelection = <Row extends Record<string, any>>({
  gridApi,
  rowKey,
  rowSelect,
  rowSelection,
}: {
  gridApi: Ref<GridApi<Row> | undefined>
  rowKey: Readonly<Ref<TableDataGridRowKey<Row>>>
  rowSelect: (selectedRows: Row[]) => void
  rowSelection: Readonly<Ref<TableDataGridRowSelectionMode>>
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

  const getRowSelectionState = (node: RowNode<Row>): TableDataGridSelectionRendererState => ({
    selected: Boolean(node.isSelected()),
    selectable: Boolean(node.selectable),
  })

  const setRowSelected = ({
    node,
    selected,
  }: {
    node: RowNode<Row>
    selected: boolean
  }) => {
    node.setSelected(selected)
  }

  const getHeaderSelectionState = (api: GridApi<Row>): TableDataGridSelectionHeaderRendererState => {
    let selectableRowCount = 0
    let selectedRowCount = 0

    api.forEachNode((node) => {
      if (!node.selectable) {
        return
      }

      selectableRowCount += 1
      if (node.isSelected()) {
        selectedRowCount += 1
      }
    })

    return {
      checked: selectableRowCount > 0 && selectedRowCount === selectableRowCount,
      disabled: selectableRowCount === 0,
      indeterminate: selectedRowCount > 0 && selectedRowCount < selectableRowCount,
    }
  }

  const setAllRowsSelected = ({
    api,
    selected,
  }: {
    api: GridApi<Row>
    selected: boolean
  }) => {
    api.forEachNode((node) => {
      if (node.selectable) {
        node.setSelected(selected)
      }
    })
  }

  const subscribeToHeaderSelectionState = ({
    api,
    onChange,
  }: {
    api: GridApi<Row>
    onChange: () => void
  }) => {
    api.addEventListener('selectionChanged', onChange)
    api.addEventListener('modelUpdated', onChange)

    return () => {
      api.removeEventListener('selectionChanged', onChange)
      api.removeEventListener('modelUpdated', onChange)
    }
  }

  const selectionRendererContext = {
    getHeaderSelectionState,
    getRowSelectionState,
    setAllRowsSelected,
    setRowSelected,
    subscribeToHeaderSelectionState,
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
    rowSelect(nextSelectedRows)
  }

  return {
    selectedRows,
    selectionRendererContext,
    rowSelectionConfig,
    selectRowByKey,
    deselectAll,
    onSelectionChange,
  }
}
