import { describe, expect, it } from 'vitest'
import type { ColumnState, GridApi } from 'ag-grid-community'
import type { TableDataGridConfig, TableDataGridHeader } from '../types'
import {
  canDisplayedColumnsFit,
  createConstrainedFitColumnWidths,
  createColumnFitParams,
  getAvailableFitWidth,
  getConfigForColumnWidthChangeDetection,
} from './columnSizing'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('column sizing utilities', () => {
  const headers: Array<TableDataGridHeader<TestRow>> = [
    { key: 'name', label: 'Name', minWidth: 160, width: 180 },
    { key: 'status', label: 'Status', maxWidth: 220 },
  ]

  const columnState: ColumnState[] = [
    { colId: 'name', hide: false, pinned: null, width: 180 },
    { colId: 'status', hide: false, pinned: null, width: 120 },
    { colId: 'ag-Grid-SelectionColumn', hide: false, pinned: 'left', width: 48 },
  ]

  const resolvedConfig: TableDataGridConfig = {
    columnOrder: ['name', 'status'],
    columns: {
      name: { visible: true, width: 180 },
      status: { visible: true, width: 120 },
    },
    pageSize: 25,
  }

  it('builds sizeColumnsToFit params from header constraints', () => {
    expect(createColumnFitParams({ headers })).toEqual({
      columnLimits: [
        { key: 'name', minWidth: 160, maxWidth: undefined },
        { key: 'status', minWidth: 120, maxWidth: 220 },
      ],
    })
  })

  it('uses the center viewport plus displayed pinned columns as available fit width', () => {
    const api = {
      getHorizontalPixelRange: () => ({ left: 50, right: 450 }),
    } as GridApi<TestRow>

    expect(getAvailableFitWidth({ api, columnState })).toBe(448)
  })

  it('uses the rendered center viewport when the live vertical scrollbar narrows the fit area', () => {
    const datatableElement = document.createElement('div')
    const centerViewport = document.createElement('div')

    Object.defineProperty(centerViewport, 'clientWidth', {
      value: 370,
    })
    centerViewport.className = 'ag-center-cols-viewport'
    datatableElement.append(centerViewport)

    const api = {
      getHorizontalPixelRange: () => ({ left: 0, right: 400 }),
    } as GridApi<TestRow>

    expect(getAvailableFitWidth({
      api,
      columnState,
      datatableElement,
    })).toBe(418)
  })

  it('creates constrained fit widths without exceeding header maxWidth', () => {
    expect(createConstrainedFitColumnWidths({
      availableWidth: 500,
      columnState: [
        { colId: 'name', hide: false, pinned: null, width: 100 },
        { colId: 'status', hide: false, pinned: null, width: 100 },
      ],
      headers: [
        { key: 'name', label: 'Name', maxWidth: 160 },
        { key: 'status', label: 'Status' },
      ],
    })).toEqual([
      { key: 'name', newWidth: 160 },
      { key: 'status', newWidth: 340 },
    ])
  })

  it('checks whether displayed columns can fit with configured widths and ag-grid-owned display columns', () => {
    expect(canDisplayedColumnsFit({
      availableWidth: 500,
      columnState,
      headers,
      resolvedTableConfig: resolvedConfig,
      honorConfiguredColumnWidths: true,
    })).toBe(true)
    expect(canDisplayedColumnsFit({
      availableWidth: 300,
      columnState,
      headers,
      resolvedTableConfig: {
        ...resolvedConfig,
        columns: {
          name: { visible: true, width: 500 },
          status: { visible: true, width: 500 },
        },
      },
      honorConfiguredColumnWidths: true,
    })).toBe(false)
  })

  it('ignores width-only layout side effects for change detection', () => {
    const gridConfig = {
      ...resolvedConfig,
      columns: {
        name: { visible: true, width: 200 },
        status: { visible: true, width: 100 },
      },
    }

    expect(getConfigForColumnWidthChangeDetection({
      columnWidthChangeSource: 'layout-side-effect',
      gridConfig,
      resolvedTableConfig: resolvedConfig,
    })).toEqual(resolvedConfig)
    expect(getConfigForColumnWidthChangeDetection({
      columnWidthChangeSource: 'intentional',
      gridConfig,
      resolvedTableConfig: resolvedConfig,
    })).toEqual(gridConfig)
  })
})
