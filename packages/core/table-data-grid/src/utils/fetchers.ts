interface GridRowRange {
  startRow: number
  endRow: number
}

interface CursorBlock {
  blockIndex: number
  pageSize: number
}

/**
 * Resolves AG Grid's zero-based, half-open row range into a cursor block.
 *
 * AG Grid passes `startRow` as inclusive and `endRow` as exclusive. It does not
 * pass a block index directly, so derive it from the range before calling
 * TableDataGrid's cursor-based fetcher.
 *
 * @param startRow AG Grid's inclusive row start for the requested block.
 * @param endRow AG Grid's exclusive row end for the requested block.
 * @returns Cursor block index and page size derived from AG Grid's row range.
 */
export const getCursorBlock = ({ startRow, endRow }: GridRowRange): CursorBlock => {
  const pageSize = endRow - startRow

  return {
    blockIndex: pageSize > 0 ? Math.floor(startRow / pageSize) : 0,
    pageSize,
  }
}

/**
 * Translates TableDataGrid fetch metadata into AG Grid's `lastRow` signal.
 *
 * An undefined value tells AG Grid to keep requesting more blocks. A number
 * tells AG Grid the absolute row index where the dataset ends.
 *
 * @param startRow AG Grid's inclusive row start for the fetched block.
 * @param rowsLength Number of rows returned by the TableDataGrid fetcher.
 * @param pageSize Requested block size derived from AG Grid's row range.
 * @param total Optional known total row count from the backend.
 * @param hasMore Optional backend signal for whether another block exists.
 * @returns AG Grid `lastRow` value, or undefined when more blocks may exist.
 */
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
