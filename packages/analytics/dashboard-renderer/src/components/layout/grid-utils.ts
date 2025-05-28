import type { GridTile } from '../../types'

export const calculateRowDefs = (tileHeight: number, tiles: GridTile<unknown>[]): string[] => {
  let rowCount = 0
  const rowMap = new Map<number, boolean>()

  tiles.forEach(t => {
    const row = t.layout.position.row
    const existingVal = rowMap.get(row)
    const eligibleForAutofit = t.layout.size.rows === 1 && !!t.layout.size.fitToContent

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
