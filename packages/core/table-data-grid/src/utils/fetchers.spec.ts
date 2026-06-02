import { describe, expect, it } from 'vitest'
import type { TableDataGridFetcherResult } from '../types'
import {
  getCursorBlock,
  resolveHasNextPageWhenTotalUnknown,
  resolveInfiniteLastRow,
  resolveInfiniteRequestSort,
} from './fetchers'

type TestRow = {
  id: string
}

describe('fetcher utilities', () => {
  it('resolves unknown-total pagination next-page state', () => {
    expect(resolveHasNextPageWhenTotalUnknown({
      page: 1,
      pageSize: 25,
      result: { data: Array.from({ length: 25 }, (_, index) => ({ id: `${index}` })) },
    })).toBe(true)
    expect(resolveHasNextPageWhenTotalUnknown({
      page: 2,
      pageSize: 25,
      result: {
        data: Array.from({ length: 25 }, (_, index) => ({ id: `${index}` })),
        total: 50,
      },
    })).toBe(false)
    expect(resolveHasNextPageWhenTotalUnknown({
      page: 1,
      pageSize: 25,
      result: {
        data: [{ id: 'row-1' }],
        hasMore: true,
      },
    })).toBe(true)
  })

  it('resolves cursor blocks and infinite last-row values', () => {
    const cursorMap = new Map<number, unknown>([[0, 'cursor-0']])

    expect(getCursorBlock({ cursorMap, startRow: 25, endRow: 50 })).toEqual({
      blockIndex: 1,
      cursor: 'cursor-0',
      pageSize: 25,
    })
    expect(resolveInfiniteLastRow({
      startRow: 50,
      pageSize: 25,
      result: { data: [{ id: 'row-1' }], hasMore: false } satisfies TableDataGridFetcherResult<TestRow>,
    })).toBe(51)
    expect(resolveInfiniteLastRow({
      startRow: 50,
      pageSize: 25,
      result: {
        data: Array.from({ length: 25 }, (_, index) => ({ id: `${index}` })),
        hasMore: true,
      },
    })).toBeUndefined()
  })

  it('prefers ag-grid infinite sort model values when present', () => {
    expect(resolveInfiniteRequestSort({
      datasourceSort: {
        sortColumnKey: 'name',
        sortColumnOrder: 'asc',
      },
      sortModel: [{ colId: 'status', sort: 'desc' }],
    })).toEqual({
      sortColumnKey: 'status',
      sortColumnOrder: 'desc',
    })
    expect(resolveInfiniteRequestSort({
      datasourceSort: {
        sortColumnKey: 'name',
        sortColumnOrder: 'asc',
      },
      sortModel: [{ colId: 'status', sort: 'invalid' }],
    })).toEqual({
      sortColumnKey: 'name',
      sortColumnOrder: 'asc',
    })
  })
})
