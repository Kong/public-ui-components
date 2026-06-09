import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type {
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import type { TableDataGridSort } from '../types'
import { useTableDataGridGridLifecycle } from './useTableDataGridGridLifecycle'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useTableDataGridGridLifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const createGridApi = (): GridApi<TestRow> => ({
    getDisplayedRowCount: vi.fn(),
  } as unknown as GridApi<TestRow>)

  it('initializes grid state and starts resize tracking after the first layout frame', () => {
    const api = createGridApi()
    const applyTableConfig = vi.fn()
    const captureGridConfig = vi.fn()
    const emitGridReady = vi.fn()
    const fitColumnsOnGridReady = vi.fn()
    const gridApi = ref<GridApi<TestRow>>()
    const isApplyingInitialColumnState = ref(false)
    const isApplyingTableConfig = ref(false)
    const refresh = vi.fn()
    const resetFetched = vi.fn()
    const resolvedSort = ref<TableDataGridSort>({
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    })
    const startResizeTracking = vi.fn()
    const updateDisplayedColumnIndexes = vi.fn()

    const lifecycle = useTableDataGridGridLifecycle<TestRow>({
      applyTableConfig,
      captureGridConfig,
      emitGridReady,
      gridApi,
      isApplyingInitialColumnState,
      isApplyingTableConfig,
      refresh,
      resetFetched,
      resolvedSort,
      sizing: {
        fitColumnsOnGridReady,
        startResizeTracking,
      },
      updateDisplayedColumnIndexes,
    })

    lifecycle.onGridReady({ api } as GridReadyEvent<TestRow>)

    expect(resetFetched).toHaveBeenCalledOnce()
    expect(applyTableConfig).toHaveBeenCalledOnce()
    expect(applyTableConfig).toHaveBeenCalledWith(api)
    expect(fitColumnsOnGridReady).toHaveBeenCalledWith(api)
    expect(captureGridConfig).toHaveBeenCalledWith(api)
    expect(gridApi.value?.getDisplayedRowCount).toBe(api.getDisplayedRowCount)
    expect(updateDisplayedColumnIndexes).toHaveBeenCalledWith(api)
    expect(emitGridReady).toHaveBeenCalledWith(api)
    expect(refresh).toHaveBeenCalledWith(resolvedSort.value)
    expect(isApplyingInitialColumnState.value).toBe(true)
    expect(startResizeTracking).not.toHaveBeenCalled()

    vi.mocked(requestAnimationFrame).mock.calls[0]?.[0](performance.now())

    expect(isApplyingInitialColumnState.value).toBe(false)
    expect(startResizeTracking).toHaveBeenCalledOnce()
  })

  it('marks table config as applying only while replaying resolved grid state', () => {
    const api = createGridApi()
    const isApplyingTableConfig = ref(false)
    const applyTableConfig = vi.fn(() => {
      expect(isApplyingTableConfig.value).toBe(true)
    })

    const lifecycle = useTableDataGridGridLifecycle<TestRow>({
      applyTableConfig,
      captureGridConfig: vi.fn(),
      emitGridReady: vi.fn(),
      gridApi: ref(),
      isApplyingInitialColumnState: ref(false),
      isApplyingTableConfig,
      refresh: vi.fn(),
      resetFetched: vi.fn(),
      resolvedSort: ref({}),
      sizing: {
        fitColumnsOnGridReady: vi.fn(),
        startResizeTracking: vi.fn(),
      },
      updateDisplayedColumnIndexes: vi.fn(),
    })

    lifecycle.applyResolvedTableConfig(api)

    expect(applyTableConfig).toHaveBeenCalledOnce()
    expect(isApplyingTableConfig.value).toBe(false)
  })
})
