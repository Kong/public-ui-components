import { describe, expect, it } from 'vitest'
import { getCursorBlock, resolveInfiniteLastRow } from './fetchers'

describe('fetcher utilities', () => {
  it('resolves cursor block details from AG Grid row ranges', () => {
    expect(getCursorBlock({ startRow: 0, endRow: 100 })).toEqual({
      blockIndex: 0,
      pageSize: 100,
    })
    expect(getCursorBlock({ startRow: 200, endRow: 300 })).toEqual({
      blockIndex: 2,
      pageSize: 100,
    })
  })

  it('resolves infinite last row values from result metadata and block size', () => {
    // AG Grid uses `lastRow` to stop asking for more blocks. A short block with
    // no explicit `hasMore` is treated as the terminal block.
    expect(resolveInfiniteLastRow({
      startRow: 0,
      rowsLength: 25,
      pageSize: 100,
    })).toBe(25)
    // A full block without total/hasMore metadata is inconclusive, so AG Grid
    // should keep requesting more blocks.
    expect(resolveInfiniteLastRow({
      startRow: 100,
      rowsLength: 100,
      pageSize: 100,
    })).toBeUndefined()
    // When the backend explicitly says there is no next page, the current block
    // end becomes AG Grid's terminal row.
    expect(resolveInfiniteLastRow({
      startRow: 100,
      rowsLength: 100,
      pageSize: 100,
      hasMore: false,
    })).toBe(200)
    // A known total is the strongest signal and should win over block shape.
    expect(resolveInfiniteLastRow({
      startRow: 100,
      rowsLength: 100,
      pageSize: 100,
      total: 250,
    })).toBe(250)
  })
})
