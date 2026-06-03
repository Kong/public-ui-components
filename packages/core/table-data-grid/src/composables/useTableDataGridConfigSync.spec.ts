import { defineComponent, h, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type {
  GridApi,
} from 'ag-grid-community'
import type {
  TableDataGridConfig,
  TableDataGridMode,
} from '../types'
import { useTableDataGridConfigSync } from './useTableDataGridConfigSync'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useTableDataGridConfigSync', () => {
  const defaultResolvedConfig: TableDataGridConfig = {
    columnOrder: ['name', 'status'],
    columnVisibility: {
      name: true,
      status: true,
    },
    columnWidths: {},
    pinnedColumns: {},
    pageSize: 25,
  }

  const createGridApi = (): GridApi<TestRow> => ({} as GridApi<TestRow>)

  const mountConfigSync = ({
    gridConfig = defaultResolvedConfig,
    getGridConfig = vi.fn(() => gridConfig),
    mode = ref<TableDataGridMode>('pagination'),
    resolvedTableConfig = defaultResolvedConfig,
    shouldRefitColumnsAfterConfigChange = vi.fn(() => true),
  }: {
    gridConfig?: TableDataGridConfig
    getGridConfig?: ReturnType<typeof vi.fn>
    mode?: ReturnType<typeof ref<TableDataGridMode>>
    resolvedTableConfig?: TableDataGridConfig
    shouldRefitColumnsAfterConfigChange?: ReturnType<typeof vi.fn>
  } = {}) => {
    const activePageSize = ref(25)
    const applyResolvedTableConfig = vi.fn()
    const emitSort = vi.fn()
    const gridApi = ref(createGridApi())
    const patchTableConfig = vi.fn()
    const refresh = vi.fn()
    const resolvedTableConfigRef = ref(resolvedTableConfig)
    const sizing = {
      scheduleColumnsToFit: vi.fn(),
      scheduleColumnsToFitAfterDisplayedColumnsChange: vi.fn(),
      shouldRefitColumnsAfterConfigChange,
    }
    let sync!: ReturnType<typeof useTableDataGridConfigSync<TestRow>>

    const wrapper = mount(defineComponent({
      setup() {
        sync = useTableDataGridConfigSync<TestRow>({
          activePageSize,
          applyResolvedTableConfig,
          emitSort,
          getGridConfig,
          gridApi,
          mode,
          patchTableConfig,
          refresh,
          resolvedTableConfig: resolvedTableConfigRef,
          sizing,
        })

        return () => h('div')
      },
    }))

    return {
      activePageSize,
      applyResolvedTableConfig,
      emitSort,
      patchTableConfig,
      refresh,
      resolvedTableConfigRef,
      shouldRefitColumnsAfterConfigChange,
      sizing,
      sync,
      wrapper,
    }
  }

  it('refreshes once and emits once per sort or page-size change', async () => {
    const {
      emitSort,
      patchTableConfig,
      refresh,
      resolvedTableConfigRef,
      sync,
    } = mountConfigSync({
      gridConfig: {
        ...defaultResolvedConfig,
        columnOrder: ['status', 'name'],
        sortColumnKey: 'status',
        sortColumnOrder: 'desc',
      },
    })

    sync.onSortChange()
    sync.onPageSizeChange({ pageSize: 50 })

    expect(emitSort).toHaveBeenCalledOnce()
    expect(emitSort).toHaveBeenCalledWith({
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    })
    expect(patchTableConfig).toHaveBeenNthCalledWith(1, {
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    })
    expect(patchTableConfig).toHaveBeenNthCalledWith(2, {
      pageSize: 50,
    })

    resolvedTableConfigRef.value = {
      ...defaultResolvedConfig,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      pageSize: 50,
    }
    await nextTick()

    expect(refresh).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledWith({
      pageSize: 50,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    })
  })

  it('does not refresh for infinite-mode sort changes because ag-grid refetches the cache', async () => {
    const { refresh, resolvedTableConfigRef } = mountConfigSync({
      mode: ref<TableDataGridMode>('infinite'),
    })

    resolvedTableConfigRef.value = {
      ...defaultResolvedConfig,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    }
    await nextTick()

    expect(refresh).not.toHaveBeenCalled()
  })

  it('only replays grid state when column layout inputs change', async () => {
    const {
      applyResolvedTableConfig,
      resolvedTableConfigRef,
      shouldRefitColumnsAfterConfigChange,
      sizing,
    } = mountConfigSync({
      resolvedTableConfig: defaultResolvedConfig,
      shouldRefitColumnsAfterConfigChange: vi.fn(() => true),
    })

    resolvedTableConfigRef.value = {
      ...defaultResolvedConfig,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      pageSize: 50,
    }
    await nextTick()

    expect(applyResolvedTableConfig).not.toHaveBeenCalled()
    expect(sizing.scheduleColumnsToFitAfterDisplayedColumnsChange).not.toHaveBeenCalled()
    expect(sizing.scheduleColumnsToFit).not.toHaveBeenCalled()
    expect(shouldRefitColumnsAfterConfigChange).not.toHaveBeenCalled()

    resolvedTableConfigRef.value = {
      ...defaultResolvedConfig,
      columnVisibility: {
        name: true,
        status: false,
      },
    }
    await nextTick()

    expect(applyResolvedTableConfig).toHaveBeenCalledOnce()
    expect(sizing.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledOnce()
  })
})
