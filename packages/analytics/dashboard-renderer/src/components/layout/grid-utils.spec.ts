import { calculateRowDefs, layoutRows } from './grid-utils'
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

describe('layoutRows', () => {
  const cellsPerRow = 20
  const tile = (id: string, col: number, row: number, cols: number, rows: number, fit_to_content?: boolean): GridTile<unknown> => ({
    id,
    type: 'chart',
    layout: { position: { col, row }, size: { cols, rows, fit_to_content } },
  })

  const layout = (tiles: Array<GridTile<unknown>>, measured: Record<string, number> = {}, columns = 6) =>
    layoutRows(tiles, calculateRowDefs(100, tiles), new Map(Object.entries(measured)), { cellsPerRow, columns })

  it('gives regular rows a full row of cells', () => {
    const boxes = layout([tile('a', 0, 0, 3, 1), tile('b', 3, 0, 3, 2)])

    expect(boxes.get('a')).toEqual({ x: 0, y: 0, w: 3, h: 20 })
    expect(boxes.get('b')).toEqual({ x: 3, y: 0, w: 3, h: 40 })
  })

  it('sizes a fit content row to its tallest tile and moves the rows below up', () => {
    const boxes = layout([
      tile('short', 0, 0, 3, 1, true),
      tile('tall', 3, 0, 3, 1, true),
      tile('below', 0, 1, 6, 1),
    ], { short: 8, tall: 14 })

    expect(boxes.get('short')).toEqual({ x: 0, y: 0, w: 3, h: 14 })
    expect(boxes.get('tall')).toEqual({ x: 3, y: 0, w: 3, h: 14 })
    expect(boxes.get('below')).toEqual({ x: 0, y: 14, w: 6, h: 20 })
  })

  it('keeps definition order when a fit content tile is taller than a row', () => {
    const boxes = layout([
      tile('services', 0, 0, 3, 1, true),
      tile('plugins', 0, 1, 3, 1, true),
    ], { services: 35, plugins: 30 })

    expect(boxes.get('services')).toEqual({ x: 0, y: 0, w: 3, h: 35 })
    expect(boxes.get('plugins')).toEqual({ x: 0, y: 35, w: 3, h: 30 })
  })

  it('gives an unmeasured fit content tile a full row height', () => {
    const boxes = layout([tile('a', 0, 0, 3, 1, true), tile('b', 3, 0, 3, 1, true)], { a: 8 })

    expect(boxes.get('a')?.h).toBe(20)
  })

  it('keeps a tile with the fit_to_content flag next to a regular tile at a full row', () => {
    const boxes = layout([tile('fit', 0, 0, 3, 1, true), tile('regular', 3, 0, 3, 1)], { fit: 8 })

    expect(boxes.get('fit')?.h).toBe(20)
  })

  it('makes a tile spanning a fit content row as tall as the rows it covers', () => {
    const boxes = layout([
      tile('fit', 0, 0, 3, 1, true),
      tile('tall', 3, 1, 3, 2),
      tile('fit2', 0, 1, 3, 1),
    ], { fit: 8 })

    expect(boxes.get('tall')).toEqual({ x: 3, y: 8, w: 3, h: 40 })
  })

  it('stacks tiles in reading order in a single column, each at its own height', () => {
    const boxes = layout([
      tile('right', 3, 0, 3, 1, true),
      tile('left', 0, 0, 3, 1, true),
      tile('below', 0, 1, 6, 2),
    ], { left: 8, right: 12 }, 1)

    expect(boxes.get('left')).toEqual({ x: 0, y: 0, w: 1, h: 8 })
    expect(boxes.get('right')).toEqual({ x: 0, y: 8, w: 1, h: 12 })
    expect(boxes.get('below')).toEqual({ x: 0, y: 20, w: 1, h: 40 })
  })

  it('sizes regular tiles to their content in a single column', () => {
    const boxes = layout([
      tile('golden', 0, 0, 6, 1),
      tile('below', 0, 1, 6, 1),
    ], { golden: 34 }, 1)

    expect(boxes.get('golden')).toEqual({ x: 0, y: 0, w: 1, h: 34 })
    expect(boxes.get('below')).toEqual({ x: 0, y: 34, w: 1, h: 20 })
  })
})
