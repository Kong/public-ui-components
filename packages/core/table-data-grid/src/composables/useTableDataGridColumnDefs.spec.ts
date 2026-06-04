import { ref, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { Slots } from 'vue'
import type {
  TableDataGridConfig,
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridRowSelectionMode,
} from '../types'
import type { TableDataGridSelectionRendererContext } from '../types/internal'
import TableDataGridCellRenderer from '../components/TableDataGridCellRenderer.vue'
import TableDataGridHeaderRenderer from '../components/TableDataGridHeaderRenderer.vue'
import TableDataGridSelectionCell from '../components/TableDataGridSelectionCell.vue'
import TableDataGridSelectionHeader from '../components/TableDataGridSelectionHeader.vue'
import { useTableDataGridColumnDefs } from './useTableDataGridColumnDefs'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useTableDataGridColumnDefs', () => {
  const createColumnDefs = ({
    agGridOptions = ref<TableDataGridGridOptions<TestRow>>({}),
    headers = ref<Array<TableDataGridHeader<TestRow>>>([
      { key: 'name', label: 'Name', hideable: false, width: 200 },
      { key: 'status', label: 'Status', width: 120 },
    ]),
    resolvedTableConfig = ref<TableDataGridConfig>({
      columnOrder: ['name', 'status'],
    }),
    rowSelection = ref<TableDataGridRowSelectionMode>('none'),
    selectionRendererContext = createSelectionRendererContext(),
    displayedColumnIndexesByKey = shallowRef(new Map<string, number>()),
    slots = {} as Slots,
  } = {}) => useTableDataGridColumnDefs<TestRow>({
    agGridOptions,
    cellAttrs: ref(undefined),
    displayedColumnIndexesByKey,
    headers,
    resolvedTableConfig,
    rowSelection,
    selectionRendererContext,
    slots,
  })

  const createSelectionRendererContext = (): TableDataGridSelectionRendererContext<TestRow> => ({
    getHeaderSelectionState: () => ({
      disabled: false,
      checked: false,
      indeterminate: false,
    }),
    getRowSelectionState: () => ({
      selected: false,
      selectable: true,
    }),
    setAllRowsSelected: vi.fn(),
    setRowSelected: vi.fn(),
    subscribeToHeaderSelectionState: vi.fn(() => vi.fn()),
  })

  it('orders column definitions from resolved table config and preserves unchanged order references', () => {
    const resolvedTableConfig = ref<TableDataGridConfig>({
      columnOrder: ['status', 'name'],
    })
    const { columnDefs } = createColumnDefs({ resolvedTableConfig })
    const initialColumnDefs = columnDefs.value

    expect(initialColumnDefs.map(column => column.colId)).toEqual(['status', 'name'])

    resolvedTableConfig.value = {
      columnOrder: ['status', 'name'],
      columnVisibility: { name: true },
    }
    expect(columnDefs.value).toBe(initialColumnDefs)

    resolvedTableConfig.value = {
      columnOrder: ['name', 'status'],
    }
    expect(columnDefs.value.map(column => column.colId)).toEqual(['name', 'status'])
  })

  it('prepends the internal selection column for multiple row selection', () => {
    const rowSelection = ref<TableDataGridRowSelectionMode>('none')
    const agGridOptions = ref<TableDataGridGridOptions<TestRow>>({
      selectionColumnDef: {
        cellClass: 'selection-cell',
        headerClass: 'selection-header',
        width: 72,
      },
    })
    const { columnDefs } = createColumnDefs({ agGridOptions, rowSelection })

    expect(columnDefs.value.map(column => column.colId)).toEqual(['name', 'status'])

    rowSelection.value = 'single'
    expect(columnDefs.value.map(column => column.colId)).toEqual(['name', 'status'])

    rowSelection.value = 'multiple'

    expect(columnDefs.value.map(column => column.colId)).toEqual(['ag-Grid-SelectionColumn', 'name', 'status'])
    expect(columnDefs.value[0]).toMatchObject({
      cellClass: 'selection-cell',
      cellRenderer: TableDataGridSelectionCell,
      colId: 'ag-Grid-SelectionColumn',
      headerClass: 'selection-header',
      headerComponent: TableDataGridSelectionHeader,
      lockPosition: 'left',
      maxWidth: 72,
      minWidth: 48,
      pinned: 'left',
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
      width: 72,
    })
  })

  it('builds ag-grid column definitions from table data grid headers', () => {
    const { columnDefs } = createColumnDefs({
      headers: ref([
        {
          key: 'name',
          label: 'Name',
          draggable: false,
          hideable: false,
          pinned: 'left',
          sortable: true,
          tooltip: 'Gateway service name',
          width: 200,
        },
        {
          key: 'status',
          label: 'Status',
          hideLabel: true,
          minWidth: 100,
          maxWidth: 240,
          resizable: false,
        },
      ]),
    })

    expect(columnDefs.value[0]).toMatchObject({
      headerName: 'Name',
      colId: 'name',
      headerComponent: TableDataGridHeaderRenderer,
      cellRenderer: TableDataGridCellRenderer,
      initialPinned: 'left',
      initialWidth: 200,
      lockVisible: true,
      resizable: true,
      sortable: true,
      suppressMovable: true,
    })
    expect(columnDefs.value[0].tooltipValueGetter?.({ value: 'fallback' } as never)).toBe('Gateway service name')
    expect(columnDefs.value[0].valueGetter?.({ data: { id: 'row-1', name: 'Gateway service', status: 200 } } as never)).toBe('Gateway service')
    expect(columnDefs.value[1]).toMatchObject({
      headerName: '',
      colId: 'status',
      initialPinned: false,
      lockVisible: false,
      maxWidth: 240,
      minWidth: 100,
      resizable: false,
      sortable: false,
    })
  })

  it('passes nested renderer context and lets ag-grid column options override defaults', () => {
    const slots = {
      status: () => 'status slot',
    } as Slots
    const cellAttrs = () => ({ 'data-testid': 'cell' })
    const displayedColumnIndexesByKey = shallowRef(new Map([['status', 1]]))
    const selectionRendererContext = createSelectionRendererContext()
    const { columnDefs, gridContext } = useTableDataGridColumnDefs<TestRow>({
      agGridOptions: ref({}),
      cellAttrs: ref(cellAttrs),
      displayedColumnIndexesByKey,
      headers: ref([
        {
          key: 'status',
          label: 'Status',
          draggable: false,
          agGridColumnOptions: {
            suppressMovable: false,
            cellClass: 'custom-status-cell',
          },
        },
      ]),
      resolvedTableConfig: ref({ columnOrder: ['status'] }),
      rowSelection: ref('none'),
      selectionRendererContext,
      slots,
    })

    expect(gridContext.value.cells).toEqual({
      cellAttrs,
      columnsByKey: new Map([['status', {
        key: 'status',
        label: 'Status',
        draggable: false,
        agGridColumnOptions: {
          suppressMovable: false,
          cellClass: 'custom-status-cell',
        },
      }]]),
      displayedColumnIndexesByKey,
      slots,
    })
    expect(gridContext.value.selection).toBe(selectionRendererContext)
    expect(gridContext.value.sort.currentSort.value).toEqual({
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
    })
    expect(gridContext.value.sort.requestSort).toEqual(expect.any(Function))
    expect(columnDefs.value[0]).toMatchObject({
      cellClass: 'custom-status-cell',
      suppressMovable: false,
    })
  })

})
