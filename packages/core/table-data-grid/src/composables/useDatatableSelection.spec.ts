import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { GridApi, RowNode } from 'ag-grid-community'
import type {
  TableDataGridGridOptions,
  TableDataGridRowSelectionMode,
} from '../types'
import TableDataGridSelectionCell from '../components/TableDataGridSelectionCell.vue'
import TableDataGridSelectionHeader from '../components/TableDataGridSelectionHeader.vue'
import { useDatatableSelection } from './useDatatableSelection'

type TestRow = {
  id: string
  name: string
}

describe('useDatatableSelection', () => {
  const rows: TestRow[] = [
    { id: 'row-1', name: 'Gateway service' },
    { id: 'row-2', name: 'Portal service' },
  ]

  const createGridApi = ({
    selectedRows = [],
  }: {
    selectedRows?: TestRow[]
  } = {}) => {
    let currentSelectedRows = selectedRows
    const rowNodes = new Map(rows.map(row => [row.id, {
      id: row.id,
      setSelected: vi.fn(),
    } as unknown as RowNode<TestRow>]))
    const api = {
      deselectAll: vi.fn(() => {
        currentSelectedRows = []
      }),
      getRowNode: vi.fn((key: string) => rowNodes.get(key)),
      getSelectedRows: vi.fn(() => currentSelectedRows),
      refreshCells: vi.fn(),
      setSelectedRows: (nextRows: TestRow[]) => {
        currentSelectedRows = nextRows
      },
    }

    return {
      api: api as unknown as GridApi<TestRow> & { setSelectedRows: (nextRows: TestRow[]) => void },
      rowNodes,
    }
  }

  const createSelection = ({
    agGridOptions = ref<TableDataGridGridOptions<TestRow>>({}),
    gridApi = ref<GridApi<TestRow>>(),
    rowSelection = ref<TableDataGridRowSelectionMode>('multiple'),
  } = {}) => {
    const emitRowSelect = vi.fn()
    const selection = useDatatableSelection<TestRow>({
      gridApi,
      rowSelection,
      agGridOptions,
      rowKey: ref('id'),
      emitRowSelect,
    })

    return {
      emitRowSelect,
      selection,
    }
  }

  it('resolves row selection mode and selection column configuration', () => {
    const rowSelection = ref<TableDataGridRowSelectionMode>('none')
    const agGridOptions = ref<TableDataGridGridOptions<TestRow>>({
      selectionColumnDef: {
        width: 72,
      },
    })
    const { selection } = createSelection({ agGridOptions, rowSelection })

    expect(selection.rowSelectionConfig.value).toBeUndefined()
    expect(selection.selectionColumnDef.value).toBeUndefined()

    rowSelection.value = 'single'
    expect(selection.rowSelectionConfig.value).toEqual({
      mode: 'singleRow',
      checkboxes: false,
      enableClickSelection: true,
    })
    expect(selection.selectionColumnDef.value).toBeUndefined()

    rowSelection.value = 'multiple'
    expect(selection.rowSelectionConfig.value).toEqual({
      mode: 'multiRow',
      checkboxes: false,
      enableClickSelection: true,
      headerCheckbox: false,
    })
    expect(selection.selectionColumnDef.value).toEqual({
      cellRenderer: TableDataGridSelectionCell,
      colId: 'ag-Grid-SelectionColumn',
      headerComponent: TableDataGridSelectionHeader,
      lockPosition: 'left',
      maxWidth: 48,
      minWidth: 48,
      pinned: 'left',
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
      width: 72,
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
})
