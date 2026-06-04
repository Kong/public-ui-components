import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { GridApi, RowNode } from 'ag-grid-community'
import type {
  TableDataGridRowSelectionMode,
} from '../types'
import { useTableDataGridSelection } from './useTableDataGridSelection'

type TestRow = {
  id: string
  name: string
}

describe('useTableDataGridSelection', () => {
  const rows: TestRow[] = [
    { id: 'row-1', name: 'Gateway service' },
    { id: 'row-2', name: 'Portal service' },
  ]

  const createGridApi = ({
    selectedRows = [],
    rowNodes = rows.map(row => ({
      id: row.id,
      data: row,
      isSelected: vi.fn(() => selectedRows.includes(row)),
      selectable: true,
      setSelected: vi.fn(),
    } as unknown as RowNode<TestRow>)),
  }: {
    selectedRows?: TestRow[]
    rowNodes?: Array<RowNode<TestRow>>
  } = {}) => {
    let currentSelectedRows = selectedRows
    const rowNodeMap = new Map(rowNodes.map(node => [String(node.id), node]))
    const api = {
      addEventListener: vi.fn(),
      deselectAll: vi.fn(() => {
        currentSelectedRows = []
      }),
      forEachNode: vi.fn((callback: (node: RowNode<TestRow>) => void) => {
        rowNodes.forEach(callback)
      }),
      getRowNode: vi.fn((key: string) => rowNodeMap.get(key)),
      getSelectedRows: vi.fn(() => currentSelectedRows),
      removeEventListener: vi.fn(),
      refreshCells: vi.fn(),
      setSelectedRows: (nextRows: TestRow[]) => {
        currentSelectedRows = nextRows
      },
    }

    return {
      api: api as unknown as GridApi<TestRow> & { setSelectedRows: (nextRows: TestRow[]) => void },
      rowNodes: rowNodeMap,
    }
  }

  const createSelection = ({
    gridApi = ref<GridApi<TestRow>>(),
    rowSelection = ref<TableDataGridRowSelectionMode>('multiple'),
  } = {}) => {
    const emitRowSelect = vi.fn()
    const selection = useTableDataGridSelection<TestRow>({
      gridApi,
      rowKey: ref('id'),
      rowSelect: emitRowSelect,
      rowSelection,
    })

    return {
      emitRowSelect,
      selection,
    }
  }

  it('resolves row selection mode', () => {
    const rowSelection = ref<TableDataGridRowSelectionMode>('none')
    const { selection } = createSelection({ rowSelection })

    expect(selection.rowSelectionConfig.value).toBeUndefined()

    rowSelection.value = 'single'
    expect(selection.rowSelectionConfig.value).toEqual({
      mode: 'singleRow',
      checkboxes: false,
      enableClickSelection: true,
    })

    rowSelection.value = 'multiple'
    expect(selection.rowSelectionConfig.value).toEqual({
      mode: 'multiRow',
      checkboxes: false,
      enableClickSelection: true,
      headerCheckbox: false,
    })
  })

  it('selects rows by key and clears selection through the grid api', () => {
    const { api, rowNodes } = createGridApi({ selectedRows: rows })
    const { emitRowSelect, selection } = createSelection({
      gridApi: ref(api),
    })

    selection.selectRowByKey('row-1')
    expect(rowNodes.get('row-1')?.setSelected).toHaveBeenCalledWith(true, true)

    selection.deselectAll()
    expect(api.deselectAll).toHaveBeenCalledOnce()
    expect(emitRowSelect).not.toHaveBeenCalled()
  })

  it('emits and refreshes changed rows only when selection changes', () => {
    const { api } = createGridApi()
    const { emitRowSelect, selection } = createSelection({
      gridApi: ref(api),
    })

    api.setSelectedRows([rows[0]])
    selection.onSelectionChange()

    expect(selection.selectedRows.value).toEqual([rows[0]])
    expect(api.refreshCells).toHaveBeenCalledWith({
      rowNodes: [api.getRowNode('row-1')],
      force: true,
    })
    expect(emitRowSelect).toHaveBeenCalledWith([rows[0]])

    vi.mocked(api.refreshCells).mockClear()
    emitRowSelect.mockClear()
    selection.onSelectionChange()

    expect(api.refreshCells).not.toHaveBeenCalled()
    expect(emitRowSelect).not.toHaveBeenCalled()

    api.setSelectedRows([rows[1]])
    selection.onSelectionChange()
    expect(api.refreshCells).toHaveBeenCalledWith({
      rowNodes: [
        api.getRowNode('row-1'),
        api.getRowNode('row-2'),
      ],
      force: true,
    })
    expect(emitRowSelect).toHaveBeenCalledWith([rows[1]])
  })

  it('emits row:select([]) once when deselectAll is reflected by selectionChanged', () => {
    const { api } = createGridApi({ selectedRows: [rows[0]] })
    const { emitRowSelect, selection } = createSelection({
      gridApi: ref(api),
    })

    selection.onSelectionChange()
    emitRowSelect.mockClear()
    vi.mocked(api.refreshCells).mockClear()

    selection.deselectAll()
    api.setSelectedRows([])
    selection.onSelectionChange()

    expect(api.deselectAll).toHaveBeenCalledOnce()
    expect(emitRowSelect).toHaveBeenCalledTimes(1)
    expect(emitRowSelect).toHaveBeenCalledWith([])
    expect(selection.selectedRows.value).toEqual([])
    expect(api.refreshCells).toHaveBeenCalledWith({
      rowNodes: [api.getRowNode('row-1')],
      force: true,
    })
  })

  it('exposes row selection state and actions for selection renderers', () => {
    const rowNode = {
      id: 'row-1',
      isSelected: vi.fn(() => true),
      selectable: false,
      setSelected: vi.fn(),
    } as unknown as RowNode<TestRow>
    const { selection } = createSelection()

    expect(selection.selectionRendererContext.getRowSelectionState(rowNode)).toEqual({
      selected: true,
      selectable: false,
    })

    selection.selectionRendererContext.setRowSelected({
      node: rowNode,
      selected: false,
    })

    expect(rowNode.setSelected).toHaveBeenCalledWith(false)
  })

  it('exposes header selection state and actions for selection renderers', () => {
    const selectedNode = {
      id: 'row-1',
      isSelected: vi.fn(() => true),
      selectable: true,
      setSelected: vi.fn(),
    } as unknown as RowNode<TestRow>
    const unselectedNode = {
      id: 'row-2',
      isSelected: vi.fn(() => false),
      selectable: true,
      setSelected: vi.fn(),
    } as unknown as RowNode<TestRow>
    const disabledNode = {
      id: 'row-3',
      isSelected: vi.fn(() => false),
      selectable: false,
      setSelected: vi.fn(),
    } as unknown as RowNode<TestRow>
    const { api } = createGridApi({
      rowNodes: [selectedNode, unselectedNode, disabledNode],
    })
    const { selection } = createSelection()

    expect(selection.selectionRendererContext.getHeaderSelectionState(api)).toEqual({
      checked: false,
      disabled: false,
      indeterminate: true,
    })

    selection.selectionRendererContext.setAllRowsSelected({
      api,
      selected: true,
    })

    expect(selectedNode.setSelected).toHaveBeenCalledWith(true)
    expect(unselectedNode.setSelected).toHaveBeenCalledWith(true)
    expect(disabledNode.setSelected).not.toHaveBeenCalled()
  })

  it('exposes a header selection subscription helper for selection renderers', () => {
    const { api } = createGridApi()
    const { selection } = createSelection()
    const onChange = vi.fn()

    const unsubscribe = selection.selectionRendererContext.subscribeToHeaderSelectionState({
      api,
      onChange,
    })

    expect(api.addEventListener).toHaveBeenCalledWith('selectionChanged', onChange)
    expect(api.addEventListener).toHaveBeenCalledWith('modelUpdated', onChange)

    unsubscribe()

    expect(api.removeEventListener).toHaveBeenCalledWith('selectionChanged', onChange)
    expect(api.removeEventListener).toHaveBeenCalledWith('modelUpdated', onChange)
  })
})
