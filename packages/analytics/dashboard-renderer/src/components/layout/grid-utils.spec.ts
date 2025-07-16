import { calculateRowDefs } from './grid-utils'
import type { GridTile } from '../../types'
import { describe, it, expect } from 'vitest'

describe('calculateRowDefs', () => {
  const getMockTile = (col: number, row: number, cols: number, rows: number, fit_to_content?: boolean): GridTile<unknown> => ({
    layout: {
      position: {
        col,
        row,
      },
      size: {
        cols,
        rows,
        ...(fit_to_content !== undefined ? { fit_to_content } : {}),
      },
    },
    id: `test-tile-${col}-${row}-${cols}-${rows}-${fit_to_content}`,
    meta: {},
  })

  it('auto-fits rows', () => {
    expect(calculateRowDefs(100, [
      getMockTile(0, 0, 2, 1, true),
      getMockTile(3, 0, 2, 1, true),
      getMockTile(0, 1, 4, 1),
    ])).toEqual(['auto', '100px'])
  })

  it("doesn't auto-fit if a tile spans multiple rows", () => {
    expect(calculateRowDefs(100, [
      getMockTile(0, 0, 2, 2, true),
      getMockTile(3, 0, 2, 1, true),
    ])).toEqual(['100px', '100px'])
  })
})
