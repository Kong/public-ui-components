interface GridRowRange {
  startRow: number
  endRow: number
}

interface CursorBlock {
  blockIndex: number
  pageSize: number
}

export const getCursorBlock = ({ startRow, endRow }: GridRowRange): CursorBlock => {
  // AG Grid uses zero-based, half-open row ranges: startRow is inclusive and
  // endRow is exclusive. A 100-row block is 0-100, then 100-200.
  const pageSize = endRow - startRow

  return {
    blockIndex: pageSize > 0 ? Math.floor(startRow / pageSize) : 0,
    pageSize,
  }
}

// Translate TableDataGrid fetch metadata into AG Grid's `lastRow` signal. An
// undefined value tells AG Grid to keep requesting more blocks.
export const resolveInfiniteLastRow = ({
  startRow,
  rowsLength,
  pageSize,
  total,
  hasMore,
}: {
  startRow: number
  rowsLength: number
  pageSize: number
  total?: number
  hasMore?: boolean
}): number | undefined => {
  if (typeof total === 'number') {
    return total
  }

  if (hasMore === true) {
    return undefined
  }

  if (hasMore === false || rowsLength < pageSize) {
    return startRow + rowsLength
  }

  return undefined
}
