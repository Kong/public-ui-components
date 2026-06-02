import { describe, expect, it } from 'vitest'
import type { ColumnState, GridApi } from 'ag-grid-community'
import type { TableDataGridConfig, TableDataGridHeader } from '../types'
import {
  canDisplayedColumnsFit,
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
    columnVisibility: {
      name: true,
      status: true,
    },
    columnWidths: {
      name: 180,
      status: 120,
    },
    pinnedColumns: {},
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
        columnWidths: {
          name: 500,
          status: 500,
        },
      },
      honorConfiguredColumnWidths: true,
    })).toBe(false)
  })

  it('ignores width-only layout side effects for change detection', () => {
    const gridConfig = {
      ...resolvedConfig,
      columnWidths: {
        name: 200,
        status: 100,
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
