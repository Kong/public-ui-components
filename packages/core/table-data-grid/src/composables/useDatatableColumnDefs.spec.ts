import { ref, shallowRef } from 'vue'
import { describe, expect, it } from 'vitest'
import type { Slots } from 'vue'
import type { TableDataGridConfig, TableDataGridHeader } from '../types'
import TableDataGridCellRenderer from '../components/TableDataGridCellRenderer.vue'
import TableDataGridHeaderRenderer from '../components/TableDataGridHeaderRenderer.vue'
import { useDatatableColumnDefs } from './useDatatableColumnDefs'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useDatatableColumnDefs', () => {
  const createColumnDefs = ({
    headers = ref<Array<TableDataGridHeader<TestRow>>>([
      { key: 'name', label: 'Name', hideable: false, width: 200 },
      { key: 'status', label: 'Status', width: 120 },
    ]),
    resolvedTableConfig = ref<TableDataGridConfig>({
      columnOrder: ['name', 'status'],
    }),
    selectionColumnDef = ref(undefined),
    displayedColumnIndexesByKey = shallowRef(new Map<string, number>()),
    slots = {} as Slots,
  } = {}) => useDatatableColumnDefs<TestRow>({
    headers,
    cellAttrs: ref(undefined),
    displayedColumnIndexesByKey,
    resolvedTableConfig,
    selectionColumnDef,
    slots,
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

  it('prepends the internal selection column when provided', () => {
    const selectionColumnDef = ref({
      colId: 'ag-Grid-SelectionColumn',
      width: 48,
    })
    const { columnDefs } = createColumnDefs({ selectionColumnDef })

    expect(columnDefs.value.map(column => column.colId)).toEqual(['ag-Grid-SelectionColumn', 'name', 'status'])
    expect(columnDefs.value[0]).toBe(selectionColumnDef.value)
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

  it('passes grid context and lets ag-grid column options override defaults', () => {
    const slots = {
      status: () => 'status slot',
    } as Slots
    const cellAttrs = () => ({ 'data-testid': 'cell' })
    const displayedColumnIndexesByKey = shallowRef(new Map([['status', 1]]))
    const { columnDefs, gridContext } = useDatatableColumnDefs<TestRow>({
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
      cellAttrs: ref(cellAttrs),
      displayedColumnIndexesByKey,
      resolvedTableConfig: ref({ columnOrder: ['status'] }),
      selectionColumnDef: ref(undefined),
      slots,
    })

    expect(gridContext.value).toEqual({
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
    expect(columnDefs.value[0]).toMatchObject({
      cellClass: 'custom-status-cell',
      suppressMovable: false,
    })
  })

})
