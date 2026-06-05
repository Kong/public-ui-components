import { describe, expect, it } from 'vitest'
import {
  toTableDataGridConfig,
  toTablePreferences,
  toTableSortPayload,
} from './tablePreferencesInterop'

describe('table preferences interop utilities', () => {
  it('converts table preferences to table data grid config', () => {
    expect(toTableDataGridConfig({
      pageSize: 50,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      columnWidths: {
        name: 240,
      },
      columnVisibility: {
        status: false,
      },
    })).toEqual({
      pageSize: 50,
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
      columns: {
        name: { width: 240 },
        status: { visible: false },
      },
    })
  })

  it('converts table data grid config to table preferences without ag-grid-only fields', () => {
    expect(toTablePreferences({
      pageSize: 50,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      columnOrder: ['status', 'name'],
      columns: {
        status: { width: 120, pinned: 'left' },
        name: { visible: true },
      },
    })).toEqual({
      pageSize: 50,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      columnWidths: {
        status: 120,
      },
      columnVisibility: {
        name: true,
      },
    })
  })

  it('converts table data grid config to table sort payloads', () => {
    expect(toTableSortPayload({
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    }, {
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
    })).toEqual({
      prevKey: 'name',
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    })
  })

  it('converts cleared table data grid sort to a deterministic table sort payload', () => {
    expect(toTableSortPayload({}, {
      sortColumnKey: 'name',
      sortColumnOrder: 'desc',
    })).toEqual({
      prevKey: 'name',
      sortColumnKey: '',
      sortColumnOrder: 'asc',
    })
  })
})
