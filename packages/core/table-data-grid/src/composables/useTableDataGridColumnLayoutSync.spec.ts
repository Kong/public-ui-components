import { defineComponent, h, nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type {
  Column,
  ColumnResizedEvent,
  DisplayedColumnsChangedEvent,
  GridApi,
} from 'ag-grid-community'
import type {
  TableDataGridMode,
  TableDataGridRowSelectionMode,
} from '../types'
import { useTableDataGridColumnLayoutSync } from './useTableDataGridColumnLayoutSync'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('useTableDataGridColumnLayoutSync', () => {
  const createDisplayedColumn = (colId: string): Column => ({
    getColId: vi.fn(() => colId),
  } as unknown as Column)

  const createGridApi = (): GridApi<TestRow> => ({
    getAllDisplayedColumns: vi.fn(() => [
      createDisplayedColumn('name'),
      createDisplayedColumn('status'),
    ]),
    getDisplayedRowCount: vi.fn(() => 1),
  } as unknown as GridApi<TestRow>)

  const mountColumnLayoutSync = ({
    isApplyingInitialColumnState = ref(false),
    mode = ref<TableDataGridMode>('pagination'),
    rowSelection = ref<TableDataGridRowSelectionMode>('none'),
  } = {}) => {
    const gridApi = ref(createGridApi())
    const sizing = {
      emitGridConfigChange: vi.fn(),
      scheduleColumnsToFitAfterDisplayedColumnsChange: vi.fn(),
      scheduleColumnsToFitAfterRenderedRowsChange: vi.fn(),
    }
    let sync!: ReturnType<typeof useTableDataGridColumnLayoutSync<TestRow>>

    const wrapper = mount(defineComponent({
      setup() {
        sync = useTableDataGridColumnLayoutSync<TestRow>({
          gridApi,
          isApplyingInitialColumnState,
          mode,
          rowSelection,
          sizing,
        })

        return () => h('div')
      },
    }))

    return {
      gridApi,
      rowSelection,
      sizing,
      sync,
      wrapper,
    }
  }

  it('tracks displayed column indexes from the ag-grid api', () => {
    const { gridApi, sync } = mountColumnLayoutSync()

    vi.mocked(gridApi.value.getAllDisplayedColumns).mockReturnValue([
      createDisplayedColumn('ag-Grid-SelectionColumn'),
      createDisplayedColumn('name'),
      createDisplayedColumn('status'),
    ])

    sync.updateDisplayedColumnIndexes(gridApi.value)

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
    const { sizing, sync } = mountColumnLayoutSync()

    sync.onColumnPinned()
    sync.onColumnLayoutChange()

    expect(sizing.emitGridConfigChange).toHaveBeenCalledTimes(2)
    expect(sizing.emitGridConfigChange).toHaveBeenNthCalledWith(1, {
      columnWidthChangeSource: 'layout-side-effect',
    })
    expect(sizing.emitGridConfigChange).toHaveBeenNthCalledWith(2, {
      columnWidthChangeSource: 'layout-side-effect',
    })
  })

  it('does not refit displayed columns during initial column state application', () => {
    const { sizing, sync } = mountColumnLayoutSync({
      isApplyingInitialColumnState: ref(true),
    })

    sync.onColumnVisibilityChange()

    expect(sizing.emitGridConfigChange).toHaveBeenCalledOnce()
    expect(sizing.emitGridConfigChange).toHaveBeenCalledWith({
      columnWidthChangeSource: 'layout-side-effect',
    })
    expect(sizing.scheduleColumnsToFitAfterDisplayedColumnsChange).not.toHaveBeenCalled()
  })

  it('refits displayed columns after user-driven column visibility changes', () => {
    const { sizing, sync } = mountColumnLayoutSync()

    sync.onColumnVisibilityChange()

    expect(sizing.emitGridConfigChange).toHaveBeenCalledOnce()
    expect(sizing.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledOnce()
  })

  it('refits columns after infinite row model updates with displayed rows', () => {
    const { gridApi, sizing, sync } = mountColumnLayoutSync({
      mode: ref<TableDataGridMode>('infinite'),
    })

    sync.onModelUpdated({ api: gridApi.value })

    expect(sizing.scheduleColumnsToFitAfterRenderedRowsChange).toHaveBeenCalledOnce()
    expect(sizing.scheduleColumnsToFitAfterRenderedRowsChange).toHaveBeenCalledWith(gridApi.value)
  })

  it('does not refit columns after pagination model updates or empty infinite model updates', () => {
    const { gridApi, sizing, sync } = mountColumnLayoutSync()

    sync.onModelUpdated({ api: gridApi.value })
    expect(sizing.scheduleColumnsToFitAfterRenderedRowsChange).not.toHaveBeenCalled()

    const infiniteGrid = mountColumnLayoutSync({
      mode: ref<TableDataGridMode>('infinite'),
    })
    vi.mocked(infiniteGrid.gridApi.value.getDisplayedRowCount).mockReturnValue(0)

    infiniteGrid.sync.onModelUpdated({ api: infiniteGrid.gridApi.value })
    expect(infiniteGrid.sizing.scheduleColumnsToFitAfterRenderedRowsChange).not.toHaveBeenCalled()
  })

  it('persists only user-completed column resizes', () => {
    const { sizing, sync } = mountColumnLayoutSync()

    sync.onColumnResize({
      source: 'sizeColumnsToFit',
      finished: true,
    } as ColumnResizedEvent<TestRow>)
    sync.onColumnResize({
      source: 'uiColumnDragged',
      finished: false,
    } as ColumnResizedEvent<TestRow>)
    sync.onColumnResize({
      source: 'uiColumnDragged',
      finished: true,
    } as ColumnResizedEvent<TestRow>)

    expect(sizing.emitGridConfigChange).toHaveBeenCalledOnce()
  })

  it('refits displayed columns after the selection column appears or disappears', async () => {
    const { gridApi, rowSelection, sizing, sync } = mountColumnLayoutSync()

    rowSelection.value = 'multiple'
    await nextTick()
    expect(sync.isRowSelectionColumnRefitPending.value).toBe(true)

    sync.onDisplayedColumnsChange({
      api: gridApi.value,
    } as DisplayedColumnsChangedEvent<TestRow>)

    expect(sizing.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledOnce()
    expect(sizing.scheduleColumnsToFitAfterDisplayedColumnsChange).toHaveBeenCalledWith(gridApi.value)
    expect(sync.isRowSelectionColumnRefitPending.value).toBe(false)
  })
})
