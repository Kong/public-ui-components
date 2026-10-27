import type { GridTile } from '../../types'

/**
 * Marks fit content rows as 'auto', every other row is tileHeight px.
 * A fit content row is one where every tile starting in it is 1 row tall and has
 * fit_to_content. A tile with fit_to_content next to a regular tile keeps the full row height.
 */
export const calculateRowDefs = (tileHeight: number, tiles: Array<GridTile<unknown>>): string[] => {
  let rowCount = 0
  const rowMap = new Map<number, boolean>()

  tiles.forEach(t => {
    const row = t.layout.position.row
    const existingVal = rowMap.get(row)
    const eligibleForAutofit = t.layout.size.rows === 1 && !!t.layout.size.fit_to_content

    rowCount = Math.max(rowCount, row + t.layout.size.rows)

    if (existingVal === undefined) {
      rowMap.set(row, eligibleForAutofit)
    } else {
      rowMap.set(row, existingVal && eligibleForAutofit)
    }
  })

  const rowDefs = []
  for (let i = 0; i < rowCount; i++) {
    if (rowMap.get(i)) {
      rowDefs.push('auto')
    } else {
      rowDefs.push(`${tileHeight}px`)
    }
  }

  return rowDefs
}

/** The tile's position in GridStack cells */
export interface CellBox {
  x: number
  y: number
  w: number
  h: number
}

interface LayoutOptions {
  cellsPerRow: number
  columns: number
}

const contentCells = (
  tile: GridTile<unknown>,
  measured: ReadonlyMap<string, number>,
  cellsPerRow: number,
): number => (
  // Until a tile's content has rendered and been measured, give it its defined height
  measured.get(`${tile.id}`) ?? tile.layout.size.rows * cellsPerRow
)

const rowHeights = (
  tiles: Array<GridTile<unknown>>,
  rowDefs: string[],
  measured: ReadonlyMap<string, number>,
  cellsPerRow: number,
): number[] => {
  return rowDefs.map((def, row) => {
    if (def !== 'auto') {
      return cellsPerRow
    }

    const inRow = tiles.filter(t => t.layout.position.row === row)

    // a fit content row is as tall as its tallest tile
    return Math.max(...inRow.map(t => contentCells(t, measured, cellsPerRow)))
  })
}

// For smaller screens every tile is sized to the content, and each tile is stacked vertically.
const layoutSingleColumn = (
  tiles: Array<GridTile<unknown>>,
  measured: ReadonlyMap<string, number>,
  cellsPerRow: number,
): Map<string, CellBox> => {
  const ordered = [...tiles].sort((a, b) => a.layout.position.row - b.layout.position.row || a.layout.position.col - b.layout.position.col)
  const boxes = new Map<string, CellBox>()

  let y = 0

  ordered.forEach(tile => {
    const h = contentCells(tile, measured, cellsPerRow)

    boxes.set(`${tile.id}`, { x: 0, y, w: 1, h })
    y += h
  })

  return boxes
}

/**
 * Lays out view mode by dashboard row. Each row starts where the row above ends, so tiles keep their order,
 * and GridStack never has to resolve a collision (which can reorder tiles).
 *
 * @param rowDefs from calculateRowDefs, 'auto' marks a fit content row
 * @param measured tile id mapped to its content height in cells
 */
export const layoutRows = (
  tiles: Array<GridTile<unknown>>,
  rowDefs: string[],
  measured: ReadonlyMap<string, number>,
  { cellsPerRow, columns }: LayoutOptions,
): Map<string, CellBox> => {
  if (columns === 1) {
    return layoutSingleColumn(tiles, measured, cellsPerRow)
  }

  // rowStarts[i] is where row i starts, in cells which is the total height of every row above it.
  // It has one extra entry at the end where the last row ends.
  const rowStarts = [0]

  rowHeights(tiles, rowDefs, measured, cellsPerRow).forEach(h => {
    rowStarts.push(rowStarts[rowStarts.length - 1] + h)
  })

  return new Map(tiles.map(tile => {
    const { position, size } = tile.layout
    const start = rowStarts[position.row]
    const end = rowStarts[position.row + size.rows]

    return [`${tile.id}`, {
      x: position.col,
      y: start,
      w: size.cols,
      h: end - start,
    }]
  }))
}
