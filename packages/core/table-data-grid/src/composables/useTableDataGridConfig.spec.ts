import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { GridApi } from 'ag-grid-community'
import type { TableDataGridConfig, TableDataGridHeader } from '../types'
import { useTableDataGridConfig } from './useTableDataGridConfig'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useTableDataGridConfig', () => {
  const headers: Array<TableDataGridHeader<TestRow>> = [
    { key: 'name', label: 'Name', hideable: false, width: 200, pinned: 'left' },
    { key: 'status', label: 'Status', width: 120 },
  ]

  const createConfig = ({
    tableConfig = ref<TableDataGridConfig | undefined>(),
  }: {
    tableConfig?: ReturnType<typeof ref<TableDataGridConfig | undefined>>
  } = {}) => {
    const emitTableConfigUpdate = vi.fn()
    const config = useTableDataGridConfig<TestRow>({
      emitTableConfigUpdate,
      headers: ref(headers),
      pageSize: ref(25),
      tableConfig,
    })

    return {
      config,
      emitTableConfigUpdate,
      tableConfig,
    }
  }

  it('emits normalized updates and suppresses no-op updates', () => {
    const { config, emitTableConfigUpdate } = createConfig()

    config.updateTableConfig({
      columnOrder: ['status', 'name'],
      columns: { status: { visible: false } },
      pageSize: 50,
    })
    config.updateTableConfig({
      columnOrder: ['status', 'name'],
      columns: { status: { visible: false } },
      pageSize: 50,
    })

    expect(emitTableConfigUpdate).toHaveBeenCalledOnce()
    expect(emitTableConfigUpdate).toHaveBeenCalledWith({
      columnOrder: ['status', 'name'],
      columns: { status: { visible: false } },
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
      pageSize: 50,
    })
  })

  it('reacts to controlled prop changes without echoing update events', async () => {
    const tableConfig = ref<TableDataGridConfig | undefined>({
      columnOrder: ['name', 'status'],
      pageSize: 25,
    })
    const { config, emitTableConfigUpdate } = createConfig({ tableConfig })

    tableConfig.value = {
      columnOrder: ['status', 'name'],
      columns: { status: { visible: false } },
      pageSize: 50,
    }
    await nextTick()

    expect(config.activePageSize.value).toBe(50)
    expect(config.resolvedColumnVisibility.value).toEqual({
      name: true,
      status: false,
    })
    expect(emitTableConfigUpdate).not.toHaveBeenCalled()
  })

  it('patches resolved config values before emitting updates', () => {
    const { config, emitTableConfigUpdate } = createConfig({
      tableConfig: ref({
        columnOrder: ['status'],
        columns: { status: { visible: false, width: 120, pinned: 'right' } },
      }),
    })

    config.patchTableConfig({
      columns: { status: { visible: true } },
      pageSize: 10,
    })

    expect(emitTableConfigUpdate).toHaveBeenCalledWith({
      columnOrder: ['status', 'name'],
      columns: {
        status: { visible: true, width: 120, pinned: 'right' },
        name: { visible: true },
      },
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
      pageSize: 10,
    })
  })

  it('delegates resolved table config to ag-grid state helpers', () => {
    const applyColumnState = vi.fn()
    const getColumnState = vi.fn().mockReturnValue([
      { colId: 'name', hide: false, pinned: 'left', sort: undefined, width: 200 },
      { colId: 'status', hide: true, pinned: null, sort: 'desc', width: 120 },
    ])
    const api = {
      applyColumnState,
      getColumnState,
    } as unknown as GridApi<TestRow>
    const { config } = createConfig({
      tableConfig: ref({
        columnOrder: ['status', 'name'],
        columns: { status: { visible: false } },
        sortColumnKey: 'status',
        sortColumnOrder: 'desc',
      }),
    })

    config.applyTableConfig(api)
    expect(applyColumnState).toHaveBeenCalledWith({
      state: [
        {
          colId: 'status',
          hide: true,
          pinned: null,
          sort: 'desc',
          width: 120,
        },
        {
          colId: 'name',
          hide: false,
          pinned: 'left',
          sort: null,
          width: 200,
        },
      ],
      applyOrder: true,
    })

    expect(config.getGridConfig(api)).toEqual({
      columnOrder: ['name', 'status'],
      columns: {
        name: {
          visible: true,
          width: 200,
          pinned: 'left',
        },
        status: {
          visible: false,
          width: 120,
          pinned: false,
        },
      },
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      pageSize: 25,
    })
  })
})
