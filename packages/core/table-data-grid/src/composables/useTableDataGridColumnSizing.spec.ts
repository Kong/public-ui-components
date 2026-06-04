import { defineComponent, h, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ColumnState, GridApi } from 'ag-grid-community'
import type { TableDataGridConfig, TableDataGridHeader } from '../types'
import { useTableDataGridColumnSizing } from './useTableDataGridColumnSizing'

type TestRow = {
  id: string
  name: string
  status: number
}

type ColumnSizing = ReturnType<typeof useTableDataGridColumnSizing<TestRow>>

describe('useTableDataGridColumnSizing', () => {
  let frameId = 0
  let scheduledFrames: Map<number, FrameRequestCallback>

  const headers: Array<TableDataGridHeader<TestRow>> = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
  ]

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

  const defaultColumnState: ColumnState[] = [
    { colId: 'name', hide: false, pinned: null, width: 160 },
    { colId: 'status', hide: false, pinned: null, width: 140 },
  ]

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

  const flushAnimationFrames = () => {
    const callbacks = Array.from(scheduledFrames.values())
    scheduledFrames.clear()
    callbacks.forEach(callback => callback(0))
  }

  const createGridApi = ({
    columnState = defaultColumnState,
    horizontalPixelRange = { left: 0, right: 500 },
  }: {
    columnState?: ColumnState[]
    horizontalPixelRange?: { left: number, right: number } | undefined
  } = {}) => ({
    getColumnState: vi.fn(() => columnState),
    getHorizontalPixelRange: vi.fn(() => horizontalPixelRange),
    setColumnWidths: vi.fn(),
    sizeColumnsToFit: vi.fn(),
  }) as unknown as GridApi<TestRow>

  const mountColumnSizing = ({
    api = createGridApi(),
    configFromGrid = defaultResolvedConfig,
    datatableWidth = 500,
    isApplyingTableConfig = false,
    resolvedTableConfig = defaultResolvedConfig,
    tableConfig,
  }: {
    api?: GridApi<TestRow>
    configFromGrid?: TableDataGridConfig
    datatableWidth?: number
    isApplyingTableConfig?: boolean
    resolvedTableConfig?: TableDataGridConfig
    tableConfig?: TableDataGridConfig
  } = {}) => {
    let sizing!: ColumnSizing
    const datatableElement = ref<HTMLElement>()
    const datatableWidthRef = ref(datatableWidth)
    const configFromGridRef = ref(configFromGrid)
    const getGridConfig = vi.fn(() => configFromGridRef.value)
    const updateTableConfig = vi.fn()
    const wrapper = mount(defineComponent({
      setup() {
        sizing = useTableDataGridColumnSizing<TestRow>({
          datatableElement,
          datatableWidth: datatableWidthRef,
          getGridConfig,
          gridApi: ref(api),
          headers: ref(headers),
          isApplyingTableConfig: ref(isApplyingTableConfig),
          resolvedTableConfig: ref(resolvedTableConfig),
          tableConfig: ref(tableConfig),
          updateTableConfig,
        })

        return () => h('div')
      },
    }))

    return {
      configFromGridRef,
      datatableElement,
      datatableWidthRef,
      getGridConfig,
      sizing,
      updateTableConfig,
      wrapper,
    }
  }

  it('does not emit grid config changes while table config is being applied', () => {
    const { getGridConfig, sizing, updateTableConfig } = mountColumnSizing({
      isApplyingTableConfig: true,
      configFromGrid: {
        ...defaultResolvedConfig,
        columnWidths: { name: 200 },
      },
    })

    sizing.persistGridConfigChange()

    expect(getGridConfig).not.toHaveBeenCalled()
    expect(updateTableConfig).not.toHaveBeenCalled()
  })

  it('ignores layout-only width differences during layout-side-effect changes', () => {
    const { sizing, updateTableConfig } = mountColumnSizing({
      resolvedTableConfig: {
        ...defaultResolvedConfig,
        columnWidths: {
          name: 160,
          status: 140,
        },
      },
      configFromGrid: {
        ...defaultResolvedConfig,
        columnWidths: {
          name: 180,
          status: 120,
        },
      },
    })

    sizing.persistGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })

    expect(updateTableConfig).not.toHaveBeenCalled()
  })

  it('emits the full grid config when layout-side-effect changes include layout state', () => {
    const gridConfig = {
      ...defaultResolvedConfig,
      columnWidths: {
        name: 180,
        status: 120,
      },
      pinnedColumns: {
        name: 'left' as const,
      },
    }
    const { sizing, updateTableConfig } = mountColumnSizing({
      resolvedTableConfig: {
        ...defaultResolvedConfig,
        columnWidths: {
          name: 160,
          status: 140,
        },
      },
      configFromGrid: gridConfig,
    })

    sizing.persistGridConfigChange({ columnWidthChangeSource: 'layout-side-effect' })

    expect(updateTableConfig).toHaveBeenCalledWith(gridConfig)
  })

  it('blocks auto-fit when configured widths represent host or user widths', () => {
    const api = createGridApi({
      horizontalPixelRange: { left: 0, right: 300 },
    })
    const configuredWidthsConfig = {
      ...defaultResolvedConfig,
      columnWidths: {
        name: 500,
        status: 500,
      },
    }
    const { sizing } = mountColumnSizing({
      api,
      resolvedTableConfig: configuredWidthsConfig,
      tableConfig: configuredWidthsConfig,
    })

    sizing.scheduleColumnsToFitAfterDisplayedColumnsChange()
    flushAnimationFrames()

    expect(api.sizeColumnsToFit).not.toHaveBeenCalled()
  })

  it('does not let auto-fitted widths block later displayed-column refits', () => {
    const api = createGridApi({
      horizontalPixelRange: { left: 0, right: 300 },
    })
    const autoFittedConfig = {
      ...defaultResolvedConfig,
      columnWidths: {
        name: 500,
        status: 500,
      },
    }
    const { configFromGridRef, sizing } = mountColumnSizing({
      api,
      configFromGrid: autoFittedConfig,
    })

    sizing.fitColumnsOnGridReady(api)
    configFromGridRef.value = autoFittedConfig
    sizing.scheduleColumnsToFitAfterDisplayedColumnsChange(api)
    flushAnimationFrames()

    expect(api.sizeColumnsToFit).toHaveBeenCalledTimes(2)
  })

  it('refits rendered rows to the live center viewport without emitting table config', () => {
    const api = createGridApi()
    const { datatableElement, sizing, updateTableConfig } = mountColumnSizing({ api })
    const element = document.createElement('div')
    const centerViewport = document.createElement('div')

    Object.defineProperty(centerViewport, 'clientWidth', {
      value: 300,
    })
    centerViewport.className = 'ag-center-cols-viewport'
    element.append(centerViewport)
    datatableElement.value = element

    sizing.scheduleColumnsToFitAfterRenderedRowsChange(api)
    flushAnimationFrames()

    expect(api.sizeColumnsToFit).not.toHaveBeenCalled()
    expect(api.setColumnWidths).toHaveBeenCalledWith([
      { key: 'name', newWidth: 160 },
      { key: 'status', newWidth: 140 },
    ], true, 'sizeColumnsToFit')
    expect(updateTableConfig).not.toHaveBeenCalled()
  })

  it('only forces configured-width fitting after the grid has mounted once', () => {
    const api = createGridApi({
      horizontalPixelRange: { left: 0, right: 1200 },
    })
    const configuredWidthsConfig = {
      ...defaultResolvedConfig,
      columnWidths: {
        name: 500,
        status: 500,
      },
    }
    const { sizing } = mountColumnSizing({
      api,
      resolvedTableConfig: configuredWidthsConfig,
      tableConfig: configuredWidthsConfig,
    })

    sizing.fitColumnsOnGridReady(api)
    expect(api.sizeColumnsToFit).not.toHaveBeenCalled()

    sizing.fitColumnsOnGridReady(api)
    expect(api.sizeColumnsToFit).toHaveBeenCalledOnce()
  })

  it('ignores resize events before tracking starts and when width is unchanged', () => {
    const api = createGridApi()
    const { datatableWidthRef, sizing } = mountColumnSizing({ api })

    sizing.handleDatatableWidthChange()
    sizing.startResizeTracking()
    sizing.handleDatatableWidthChange()
    expect(api.sizeColumnsToFit).not.toHaveBeenCalled()

    datatableWidthRef.value = 640
    sizing.handleDatatableWidthChange()
    flushAnimationFrames()

    expect(api.sizeColumnsToFit).toHaveBeenCalledOnce()
  })

  it('cancels previously scheduled fit frames before scheduling a replacement', () => {
    const api = createGridApi()
    const { sizing } = mountColumnSizing({ api })

    sizing.scheduleColumnsToFit()
    sizing.scheduleColumnsToFit()
    flushAnimationFrames()

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
    expect(api.sizeColumnsToFit).toHaveBeenCalledOnce()
  })

  it('cancels a pending fit frame when the owning component unmounts', () => {
    const api = createGridApi()
    const { sizing, wrapper } = mountColumnSizing({ api })

    sizing.scheduleColumnsToFit()
    wrapper.unmount()

    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
    expect(scheduledFrames.size).toBe(0)
  })
})
