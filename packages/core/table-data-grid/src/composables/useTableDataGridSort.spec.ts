import type { TableDataGridSort } from '../types'
import type { GridApi, SortChangedEvent } from 'ag-grid-community'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useTableDataGridSort } from './useTableDataGridSort'

type TestRow = { name: string }

type FakeColumnState = { colId: string, sort: 'asc' | 'desc' | null, sortIndex: number | null }

const createFakeApi = (columnState: FakeColumnState[]) => ({
  getColumnState: vi.fn(() => columnState),
  applyColumnState: vi.fn(),
}) as unknown as GridApi<TestRow> & {
  getColumnState: () => FakeColumnState[]
  applyColumnState: (params: unknown) => void
}

const createEvent = (api: GridApi<TestRow>) => ({ api }) as SortChangedEvent<TestRow>

describe('useTableDataGridSort', () => {
  it('emits sort before patching the config, in order, on a genuine change', () => {
    const activeSort = ref<TableDataGridSort>({})
    const calls: string[] = []
    const emitSort = vi.fn(() => calls.push('sort'))
    const patchTableConfig = vi.fn(() => calls.push('patch'))

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, emitSort, patchTableConfig })
    const api = createFakeApi([{ colId: 'name', sort: 'asc', sortIndex: 0 }])

    onSortChanged(createEvent(api))

    expect(emitSort).toHaveBeenCalledWith({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    expect(patchTableConfig).toHaveBeenCalledWith({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    expect(calls).toEqual(['sort', 'patch'])
  })

  it('emits an empty sort when the grid reports no sorted columns', () => {
    const activeSort = ref<TableDataGridSort>({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    const emitSort = vi.fn()
    const patchTableConfig = vi.fn()

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, emitSort, patchTableConfig })
    const api = createFakeApi([])

    onSortChanged(createEvent(api))

    expect(emitSort).toHaveBeenCalledWith({ sortColumnKey: undefined, sortColumnOrder: undefined })
    expect(patchTableConfig).toHaveBeenCalledWith({ sortColumnKey: undefined, sortColumnOrder: undefined })
  })

  it('is a no-op when the resolved sort already matches activeSort', () => {
    const activeSort = ref<TableDataGridSort>({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    const emitSort = vi.fn()
    const patchTableConfig = vi.fn()

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, emitSort, patchTableConfig })
    const api = createFakeApi([{ colId: 'name', sort: 'asc', sortIndex: 0 }])

    onSortChanged(createEvent(api))

    expect(emitSort).not.toHaveBeenCalled()
    expect(patchTableConfig).not.toHaveBeenCalled()
  })

  it('collapses more than one sorted column to the most recent and re-applies it', () => {
    const activeSort = ref<TableDataGridSort>({})
    const emitSort = vi.fn()
    const patchTableConfig = vi.fn()

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, emitSort, patchTableConfig })
    const api = createFakeApi([
      { colId: 'name', sort: 'asc', sortIndex: 0 },
      { colId: 'status', sort: 'desc', sortIndex: 1 },
    ])

    onSortChanged(createEvent(api))

    // 'status' has the higher sortIndex, so it's the one kept.
    expect(emitSort).toHaveBeenCalledWith({ sortColumnKey: 'status', sortColumnOrder: 'desc' })
    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'status', sort: 'desc', sortIndex: 0 }],
      defaultState: { sort: null, sortIndex: null },
    })
  })

  it('applySortToGrid clears grid sort state when given an empty sort', () => {
    const activeSort = ref<TableDataGridSort>({})
    const { applySortToGrid } = useTableDataGridSort<TestRow>({
      activeSort,
      emitSort: vi.fn(),
      patchTableConfig: vi.fn(),
    })
    const api = createFakeApi([])

    applySortToGrid(api, {})

    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [],
      defaultState: { sort: null, sortIndex: null },
    })
  })
})
