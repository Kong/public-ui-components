import { defineComponent, h, nextTick, ref } from 'vue'
import type { Ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type {
  Column,
  ColumnResizedEvent,
  DisplayedColumnsChangedEvent,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import type {
  TableDataGridConfig,
  TableDataGridMode,
  TableDataGridRowSelectionMode,
} from '../types'
import { useDatatableGridSync } from './useDatatableGridSync'

type TestRow = {
  id: string
  name: string
  status: number
}

type GridSync = ReturnType<typeof useDatatableGridSync>

describe('useDatatableGridSync', () => {
  let frameId = 0
  let scheduledFrames: Map<number, FrameRequestCallback>

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

  beforeEach(() => {
    frameId = 0
    scheduledFrames = new Map()
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameId += 1
      scheduledFrames.set(frameId, callback)
      return frameId
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
      scheduledFrames.delete(id)
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const createDisplayedColumn = (colId: string): Column => ({
    getColId: vi.fn(() => colId),
  } as unknown as Column)

  const createGridApi = (): GridApi<TestRow> => ({
    getColumnState: vi.fn(),
    getAllDisplayedColumns: vi.fn(() => [
      createDisplayedColumn('name'),
      createDisplayedColumn('status'),
    ]),
    getHorizontalPixelRange: vi.fn(),
    sizeColumnsToFit: vi.fn(),
    applyColumnState: vi.fn(),
  } as unknown as GridApi<TestRow>)

  const mountGridSync = ({
    applyTableConfig = vi.fn(),
    emitGridConfigChange,
    gridConfig = defaultResolvedConfig,
    getGridConfig = vi.fn(() => gridConfig),
    resolvedTableConfig = defaultResolvedConfig,
    mode = ref<TableDataGridMode>('pagination'),
    rowSelection = ref<TableDataGridRowSelectionMode>('none'),
    shouldRefitColumnsAfterConfigChange = vi.fn(() => true),
  }: {
    applyTableConfig?: ReturnType<typeof vi.fn>
    emitGridConfigChange?: ReturnType<typeof vi.fn>
    gridConfig?: TableDataGridConfig
    getGridConfig?: ReturnType<typeof vi.fn>
    resolvedTableConfig?: TableDataGridConfig
    mode?: Ref<TableDataGridMode>
    rowSelection?: Ref<TableDataGridRowSelectionMode>
    shouldRefitColumnsAfterConfigChange?: ReturnType<typeof vi.fn>
  } = {}) => {
    let sync!: GridSync
    const gridApi = ref(createGridApi())
    const resolvedTableConfigRef = ref(resolvedTableConfig)
    const activePageSize = ref(25)
    const patchTableConfig = vi.fn()
    const resetFetched = vi.fn()
    const refresh = vi.fn()
    const emitGridReady = vi.fn()
    const emitSort = vi.fn()
    const captureGridConfig = vi.fn()
    const sizingHandlers = {
      emitGridConfigChange: emitGridConfigChange ?? vi.fn(() => {
        if (!sync.isApplyingTableConfig.value) {
          patchTableConfig(gridConfig)
        }
      }),
      fitColumnsOnGridReady: vi.fn(),
      scheduleColumnsToFit: vi.fn(),
      scheduleColumnsToFitAfterDisplayedColumnsChange: vi.fn(),
      shouldRefitColumnsAfterConfigChange,
      startResizeTracking: vi.fn(),
    }

    const wrapper = mount(defineComponent({
      setup() {
        sync = useDatatableGridSync<TestRow>({
          activePageSize,
          captureGridConfig,
          applyTableConfig,
          emitGridReady,
          emitSort,
          getGridConfig,
          gridApi,
          mode,
          patchTableConfig,
          resetFetched,
          refresh,
          resolvedSort: ref({
            sortColumnKey: resolvedTableConfigRef.value.sortColumnKey,
            sortColumnOrder: resolvedTableConfigRef.value.sortColumnOrder,
          }),
          resolvedTableConfig: resolvedTableConfigRef,
          rowSelection,
        })
        sync.connectSizing(sizingHandlers)

        return () => h('div')
      },
    }))

    return {
      activePageSize,
      applyTableConfig,
      captureGridConfig,
      emitGridConfigChange: sizingHandlers.emitGridConfigChange,
      emitGridReady,
      emitSort,
      gridApi,
      patchTableConfig,
      resetFetched,
      refresh,
      resolvedTableConfigRef,
      rowSelection,
      shouldRefitColumnsAfterConfigChange,
      sizingHandlers,
      sync,
      wrapper,
    }
  }

  it('suppresses config emits while applying table config', () => {
    const {
      applyTableConfig,
      emitGridConfigChange,
      gridApi,
      patchTableConfig,
      resetFetched,
      sync,
    } = mountGridSync({
      applyTableConfig: vi.fn(() => {
        sync.onColumnResize({
          source: 'body',
          finished: true,
        } as ColumnResizedEvent<TestRow>)
      }),
    })

    sync.onGridReady({
      api: gridApi.value,
    } as GridReadyEvent<TestRow>)

    expect(applyTableConfig).toHaveBeenCalledOnce()
    expect(resetFetched).toHaveBeenCalledOnce()
    expect(emitGridConfigChange).toHaveBeenCalledOnce()
    expect(patchTableConfig).not.toHaveBeenCalled()
  })

  it('refreshes once and emits once per sort or page-size change', async () => {
    const {
      emitSort,
      patchTableConfig,
      refresh,
      resolvedTableConfigRef,
      sync,
    } = mountGridSync({
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
    const { refresh, resolvedTableConfigRef } = mountGridSync({
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
      applyTableConfig,
      resolvedTableConfigRef,
      shouldRefitColumnsAfterConfigChange,
      sizingHandlers,
    } = mountGridSync({
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

    expect(applyTableConfig).not.toHaveBeenCalled()
    expect(sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange).not.toHaveBeenCalled()
    expect(sizingHandlers.scheduleColumnsToFit).not.toHaveBeenCalled()
    expect(shouldRefitColumnsAfterConfigChange).not.toHaveBeenCalled()

    resolvedTableConfigRef.value = {
      ...defaultResolvedConfig,
      columnVisibility: {
        name: true,
        status: false,
      },
    }
    await nextTick()

    expect(applyTableConfig).toHaveBeenCalledOnce()
    expect(sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledOnce()
  })

  it('tracks displayed column indexes from the ag-grid api', () => {
    const { gridApi, sync } = mountGridSync()

    vi.mocked(gridApi.value.getAllDisplayedColumns).mockReturnValue([
      createDisplayedColumn('ag-Grid-SelectionColumn'),
      createDisplayedColumn('name'),
      createDisplayedColumn('status'),
    ])

    sync.onGridReady({
      api: gridApi.value,
    } as GridReadyEvent<TestRow>)

    expect(sync.displayedColumnIndexesByKey.value).toEqual(new Map([
      ['ag-Grid-SelectionColumn', 0],
      ['name', 1],
      ['status', 2],
    ]))

    vi.mocked(gridApi.value.getAllDisplayedColumns).mockReturnValue([
      createDisplayedColumn('status'),
      createDisplayedColumn('name'),
    ])

    sync.onDisplayedColumnsChange({
      api: gridApi.value,
    } as DisplayedColumnsChangedEvent<TestRow>)

    expect(sync.displayedColumnIndexesByKey.value).toEqual(new Map([
      ['status', 0],
      ['name', 1],
    ]))
  })

  it('emits layout-side-effect config changes for pin and layout events', () => {
    const { emitGridConfigChange, sync } = mountGridSync()

    sync.onColumnPinned()
    sync.onColumnLayoutChange()

    expect(emitGridConfigChange).toHaveBeenCalledTimes(2)
    expect(emitGridConfigChange).toHaveBeenNthCalledWith(1, {
      columnWidthChangeSource: 'layout-side-effect',
    })
    expect(emitGridConfigChange).toHaveBeenNthCalledWith(2, {
      columnWidthChangeSource: 'layout-side-effect',
    })
  })

  it('does not refit displayed columns during initial column state application', () => {
    const { emitGridConfigChange, gridApi, sizingHandlers, sync } = mountGridSync()

    sync.onGridReady({
      api: gridApi.value,
    } as GridReadyEvent<TestRow>)
    vi.mocked(emitGridConfigChange).mockClear()

    sync.onColumnVisibilityChange()

    expect(emitGridConfigChange).toHaveBeenCalledOnce()
    expect(emitGridConfigChange).toHaveBeenCalledWith({
      columnWidthChangeSource: 'layout-side-effect',
    })
    expect(sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange).not.toHaveBeenCalled()
  })

  it('refits displayed columns after the selection column appears or disappears', async () => {
    const { gridApi, rowSelection, sizingHandlers, sync } = mountGridSync()

    rowSelection.value = 'multiple'
    await nextTick()
    expect(sync.isRowSelectionColumnRefitPending.value).toBe(true)

    sync.onDisplayedColumnsChange({
      api: gridApi.value,
    } as DisplayedColumnsChangedEvent<TestRow>)

    expect(sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledOnce()
    expect(sizingHandlers.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledWith(gridApi.value)
    expect(sync.isRowSelectionColumnRefitPending.value).toBe(false)
  })

  it('throws when sizing handlers are connected more than once', () => {
    const { sizingHandlers, sync } = mountGridSync()

    expect(() => sync.connectSizing(sizingHandlers)).toThrow('already connected')
  })
})
