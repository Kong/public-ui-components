import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type {
  CellClickedEvent,
  ProcessRowParams,
  RowClickedEvent,
} from 'ag-grid-community'
import type {
  TableDataGridGridOptions,
  TableDataGridHeader,
  TableDataGridRowAttrs,
  TableDataGridRowKey,
} from '../types'
import { useTableDataGridInteractions } from './useTableDataGridInteractions'

type TestRow = {
  id: string
  name: string
  status: string
}

describe('useTableDataGridInteractions', () => {
  const headers: Array<TableDataGridHeader<TestRow>> = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', disableRowClick: true },
  ]

  const createInteractions = ({
    agGridOptions = ref<TableDataGridGridOptions<TestRow>>({}),
    rowAttrs = ref<TableDataGridRowAttrs<TestRow> | undefined>(),
    rowKey = ref<TableDataGridRowKey<TestRow>>('id'),
  } = {}) => {
    const emit = {
      cellClick: vi.fn(),
      rowClick: vi.fn(),
    }
    const interactions = useTableDataGridInteractions<TestRow>({
      emit,
      inputs: {
        agGridOptions,
        headers: ref(headers),
        rowAttrs,
        rowKey,
      },
    })

    return {
      emit,
      interactions,
    }
  }

  const createRowClickEvent = ({
    colId,
    data = { id: '1', name: 'Gateway', status: 'ok' },
  }: {
    colId: string
    data?: TestRow
  }): RowClickedEvent<TestRow> => {
    const cell = document.createElement('div')
    cell.className = 'ag-cell'
    cell.setAttribute('col-id', colId)
    const button = document.createElement('button')
    cell.appendChild(button)

    return {
      data,
      event: {
        target: button,
      },
    } as unknown as RowClickedEvent<TestRow>
  }

  it('resolves row ids and suppresses row clicks for disabled columns', () => {
    const {
      emit,
      interactions,
    } = createInteractions()

    expect(interactions.getAgGridRowId({
      data: { id: 'row-1', name: 'Gateway', status: 'ok' },
    })).toBe('row-1')

    interactions.onRowClick(createRowClickEvent({ colId: 'status' }))
    expect(emit.rowClick).not.toHaveBeenCalled()

    const event = createRowClickEvent({ colId: 'name' })
    interactions.onRowClick(event)
    expect(emit.rowClick).toHaveBeenCalledWith(event.data, event)
  })

  it('emits cell click payloads only when row data and column id exist', () => {
    const {
      emit,
      interactions,
    } = createInteractions()
    const row = { id: '1', name: 'Gateway', status: 'ok' }

    interactions.onCellClick({
      data: row,
      colDef: {
        colId: 'status',
      },
      value: 'ok',
    } as CellClickedEvent<TestRow>)
    interactions.onCellClick({
      data: row,
      colDef: {},
      value: 'Gateway',
    } as CellClickedEvent<TestRow>)

    expect(emit.cellClick).toHaveBeenCalledOnce()
    expect(emit.cellClick).toHaveBeenCalledWith({
      row,
      columnKey: 'status',
      value: 'ok',
    })
  })

  it('runs host row post-create handling and patches configured row attrs', () => {
    const processRowPostCreate = vi.fn()
    const eRow = document.createElement('div')
    const ePinnedLeftRow = document.createElement('div')
    const ePinnedRightRow = document.createElement('div')
    const row = { id: '1', name: 'Gateway', status: 'ok' }
    const {
      interactions,
    } = createInteractions({
      agGridOptions: ref({
        processRowPostCreate,
      }),
      rowAttrs: ref(() => ({
        class: ['is-ok'],
        style: {
          '--row-status-color': 'green',
        },
        'data-row-status': row.status,
      })),
    })

    const params = {
      ePinnedLeftRow,
      ePinnedRightRow,
      eRow,
      node: {
        data: row,
      },
    } as unknown as ProcessRowParams<TestRow>

    interactions.onRowPostCreate(params)

    expect(processRowPostCreate).toHaveBeenCalledWith(params)
    for (const element of [eRow, ePinnedLeftRow, ePinnedRightRow]) {
      expect(element.classList.contains('is-ok')).toBe(true)
      expect(element.style.getPropertyValue('--row-status-color')).toBe('green')
      expect(element.getAttribute('data-row-status')).toBe('ok')
    }
  })
})
