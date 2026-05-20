import { describe, expect, it } from 'vitest'
import type { GridApi } from 'ag-grid-community'
import type { AnalyticsDatatableHeader } from '../types'
import {
  buildColumnStateFromConfig,
  createResolvedTableConfig,
  getConfigFromGrid,
  mergeColumnOrder,
  normalizedTableConfigsEqual,
  normalizeTableConfig,
} from './tableConfig'

type TestRow = {
  id: string
  name: string
  status: number
}

describe('table config utilities', () => {
  const headers: Array<AnalyticsDatatableHeader<TestRow>> = [
    { key: 'name', label: 'Name', hideable: false, width: 200, pinned: 'left' },
    { key: 'status', label: 'Status' },
  ]

  it('normalizes partial table config values without mutating input', () => {
    const partialConfig = {
      columnVisibility: { status: false },
      pageSize: 50,
    }

    expect(normalizeTableConfig(partialConfig)).toEqual({
      columnOrder: [],
      columnVisibility: { status: false },
      columnWidths: {},
      pinnedColumns: {},
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
      pageSize: 50,
    })
    expect(partialConfig).toEqual({
      columnVisibility: { status: false },
      pageSize: 50,
    })
  })

  it('resolves partial table config values against current headers', () => {
    expect(createResolvedTableConfig({
      headers: [
        ...headers,
        { key: 'method', label: 'Method' },
      ],
      pageSize: 25,
      config: {
        columnOrder: ['status', 'stale'],
        columnVisibility: {
          status: false,
          stale: false,
        },
        columnWidths: {
          name: 200,
          stale: 100,
        },
        pinnedColumns: {
          method: 'right',
          stale: 'left',
        },
        sortColumnKey: 'stale',
        sortColumnOrder: 'asc',
      },
    })).toEqual({
      columnOrder: ['status', 'name', 'method'],
      columnVisibility: {
        name: true,
        status: false,
        method: true,
      },
      columnWidths: {
        name: 200,
      },
      pinnedColumns: {
        method: 'right',
      },
      pageSize: 25,
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
    })
  })

  it('keeps non-hideable columns visible during config resolution', () => {
    expect(createResolvedTableConfig({
      headers,
      pageSize: 25,
      config: {
        columnVisibility: {
          name: false,
          status: false,
        },
      },
    }).columnVisibility).toEqual({
      name: true,
      status: false,
    })
  })

  it('merges configured column order with remaining known columns', () => {
    expect(mergeColumnOrder(['status', 'stale', 'status'], ['name', 'status', 'method'])).toEqual([
      'status',
      'name',
      'method',
    ])
  })

  it('builds ag-grid column state from config and header defaults', () => {
    expect(buildColumnStateFromConfig({
      headers,
      config: normalizeTableConfig({
        columnOrder: ['status', 'name'],
        columnVisibility: { status: false },
        columnWidths: { status: 120 },
        pinnedColumns: { status: 'right' },
        sortColumnKey: 'status',
        sortColumnOrder: 'asc',
      }),
    })).toEqual([
      {
        colId: 'status',
        hide: true,
        pinned: 'right',
        sort: 'asc',
        width: 120,
      },
      {
        colId: 'name',
        hide: undefined,
        pinned: 'left',
        sort: null,
        width: 200,
      },
    ])
  })

  it('allows config to explicitly unpin a default-pinned header', () => {
    expect(buildColumnStateFromConfig({
      headers,
      config: normalizeTableConfig({
        columnOrder: ['name', 'status'],
        pinnedColumns: { name: false },
      }),
    }).find(column => column.colId === 'name')?.pinned).toBe(null)
  })

  it('extracts table config from ag-grid state', () => {
    const api = {
      getColumnState: () => [
        { colId: 'ag-Grid-SelectionColumn', hide: false, width: 48, pinned: 'left' },
        { colId: 'name', hide: false, width: 180, pinned: 'left' },
        { colId: 'status', hide: true, width: 120, pinned: null, sort: 'desc' },
      ],
    } as GridApi<TestRow>

    expect(getConfigFromGrid({ api, headers, pageSize: 25 })).toEqual({
      columnOrder: ['name', 'status'],
      columnVisibility: {
        name: true,
        status: false,
      },
      columnWidths: {
        name: 180,
        status: 120,
      },
      pinnedColumns: {
        name: 'left',
        status: false,
      },
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      pageSize: 25,
    })
  })

  it('omits sort when no ag-grid column is sorted', () => {
    const api = {
      getColumnState: () => [
        { colId: 'name', hide: false, width: 180, pinned: null },
      ],
    } as GridApi<TestRow>

    expect(getConfigFromGrid({ api, headers, pageSize: 25 })).toMatchObject({
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
    })
  })

  it('compares normalized configs across persisted fields', () => {
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig(),
      normalizeTableConfig(),
    )).toBe(true)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnVisibility: { name: true } }),
      normalizeTableConfig({ columnVisibility: { name: false } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnOrder: ['name', 'status'] }),
      normalizeTableConfig({ columnOrder: ['status', 'name'] }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnWidths: { name: 100 } }),
      normalizeTableConfig({ columnWidths: { name: 120 } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ pinnedColumns: { name: 'left' } }),
      normalizeTableConfig({ pinnedColumns: { name: false } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ pinnedColumns: { name: false } }),
      normalizeTableConfig(),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ sortColumnKey: 'name', sortColumnOrder: 'asc' }),
      normalizeTableConfig({ sortColumnKey: 'name', sortColumnOrder: 'desc' }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ pageSize: 25 }),
      normalizeTableConfig({ pageSize: 50 }),
    )).toBe(false)
  })

})
