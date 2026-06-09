import { describe, expect, it } from 'vitest'
import type { GridApi } from 'ag-grid-community'
import type { TableDataGridHeader } from '../types'
import {
  buildColumnStateFromConfig,
  createDefaultTableDataGridConfig,
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
  const headers: Array<TableDataGridHeader<TestRow>> = [
    { key: 'name', label: 'Name', hideable: false, width: 200, pinned: 'left' },
    { key: 'status', label: 'Status' },
  ]

  it('normalizes partial table config values without mutating input', () => {
    const partialConfig = {
      columns: { status: { visible: false } },
      pageSize: 50,
    }

    expect(normalizeTableConfig(partialConfig)).toEqual({
      columnOrder: [],
      columns: { status: { visible: false } },
      sortColumnKey: undefined,
      sortColumnOrder: undefined,
      pageSize: 50,
    })
    expect(partialConfig).toEqual({
      columns: { status: { visible: false } },
      pageSize: 50,
    })
  })

  it('creates default table config from header defaults', () => {
    expect(createDefaultTableDataGridConfig({
      headers: [
        { key: 'name', label: 'Name', visible: false },
        { key: 'status', label: 'Status', hideable: false, visible: false },
      ],
      pageSize: 25,
    })).toEqual({
      columnOrder: ['name', 'status'],
      columns: {
        name: { visible: false },
        status: { visible: true },
      },
      pageSize: 25,
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
        columns: {
          status: { visible: false },
          stale: { visible: false, width: 100, pinned: 'left' },
          name: { width: 200 },
          method: { pinned: 'right' },
        },
        sortColumnKey: 'stale',
        sortColumnOrder: 'asc',
      },
    })).toEqual({
      columnOrder: ['status', 'name', 'method'],
      columns: {
        status: { visible: false },
        name: { visible: true, width: 200 },
        method: { visible: true, pinned: 'right' },
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
        columns: {
          name: { visible: false },
          status: { visible: false },
        },
      },
    }).columns).toEqual({
      name: { visible: true },
      status: { visible: false },
    })
  })

  it('uses header visibility as the default column visibility', () => {
    expect(createResolvedTableConfig({
      headers: [
        { key: 'name', label: 'Name', visible: false },
        { key: 'status', label: 'Status' },
      ],
      pageSize: 25,
    }).columns).toEqual({
      name: { visible: false },
      status: { visible: true },
    })
  })

  it('keeps non-hideable columns visible when header visibility is false', () => {
    expect(createResolvedTableConfig({
      headers: [
        { key: 'name', label: 'Name', hideable: false, visible: false },
        { key: 'status', label: 'Status', visible: false },
      ],
      pageSize: 25,
    }).columns).toEqual({
      name: { visible: true },
      status: { visible: false },
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
        columns: {
          status: { visible: false, width: 120, pinned: 'right' },
        },
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
        columns: { name: { pinned: false } },
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
      columns: {
        name: {
          visible: true,
          width: 180,
          pinned: 'left',
        },
        status: {
          visible: false,
          width: 120,
          pinned: false,
        },
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
      normalizeTableConfig({ columns: { name: { visible: true } } }),
      normalizeTableConfig({ columns: { name: { visible: false } } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columnOrder: ['name', 'status'] }),
      normalizeTableConfig({ columnOrder: ['status', 'name'] }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columns: { name: { width: 100 } } }),
      normalizeTableConfig({ columns: { name: { width: 120 } } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columns: { name: { pinned: 'left' } } }),
      normalizeTableConfig({ columns: { name: { pinned: false } } }),
    )).toBe(false)
    expect(normalizedTableConfigsEqual(
      normalizeTableConfig({ columns: { name: { pinned: false } } }),
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
