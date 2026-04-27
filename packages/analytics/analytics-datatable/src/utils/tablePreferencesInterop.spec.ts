import { describe, expect, it } from 'vitest'
import {
  toAnalyticsTableConfig,
  toTablePreferences,
  toTableSortPayload,
} from './tablePreferencesInterop'

describe('table preferences interop utilities', () => {
  it('converts table preferences to analytics table config', () => {
    expect(toAnalyticsTableConfig({
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
      columnWidths: {
        name: 240,
      },
      columnVisibility: {
        status: false,
      },
    })
  })

  it('converts analytics table config to table preferences without ag-grid-only fields', () => {
    expect(toTablePreferences({
      pageSize: 50,
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
      columnOrder: ['status', 'name'],
      columnWidths: {
        status: 120,
      },
      columnVisibility: {
        name: true,
      },
      pinnedColumns: {
        status: 'left',
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

  it('converts analytics table config to table sort payloads', () => {
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

  it('converts cleared analytics sort to a deterministic table sort payload', () => {
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
