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
  it('clears the config sort when the grid reports no sorted columns', () => {
    const activeSort = ref<TableDataGridSort>({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    const patchTableConfig = vi.fn()

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, patchTableConfig })
    const api = createFakeApi([])

    onSortChanged(createEvent(api))

    expect(patchTableConfig).toHaveBeenCalledWith({ sortColumnKey: undefined, sortColumnOrder: undefined })
  })

  it('is a no-op when the resolved sort already matches activeSort', () => {
    const activeSort = ref<TableDataGridSort>({ sortColumnKey: 'name', sortColumnOrder: 'asc' })
    const patchTableConfig = vi.fn()

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, patchTableConfig })
    const api = createFakeApi([{ colId: 'name', sort: 'asc', sortIndex: 0 }])

    onSortChanged(createEvent(api))

    expect(patchTableConfig).not.toHaveBeenCalled()
  })

  it('collapses more than one sorted column to the most recent and re-applies it', () => {
    const activeSort = ref<TableDataGridSort>({})
    const patchTableConfig = vi.fn()

    const { onSortChanged } = useTableDataGridSort<TestRow>({ activeSort, patchTableConfig })
    const api = createFakeApi([
      { colId: 'name', sort: 'asc', sortIndex: 0 },
      { colId: 'status', sort: 'desc', sortIndex: 1 },
    ])

    onSortChanged(createEvent(api))

    // 'status' has the higher sortIndex, so it's the one kept.
    expect(patchTableConfig).toHaveBeenCalledWith({ sortColumnKey: 'status', sortColumnOrder: 'desc' })
    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'status', sort: 'desc', sortIndex: 0 }],
      defaultState: { sort: null, sortIndex: null },
    })
  })

  it('applySortToGrid clears grid sort state when given an empty sort', () => {
    const activeSort = ref<TableDataGridSort>({})
    const { applySortToGrid } = useTableDataGridSort<TestRow>({
      activeSort,
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
