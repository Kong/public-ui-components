import type {
  TableDataGridConfig,
  TableDataGridFetcherParams,
  TableDataGridFetcherResult,
} from '../types'

type InfiniteSortModelItem = {
  colId?: string
  sort?: string
}

export type RefreshOptions = {
  pageSize?: number
  sortColumnKey?: TableDataGridConfig['sortColumnKey']
  sortColumnOrder?: TableDataGridConfig['sortColumnOrder']
}

export const resolveInfiniteRequestSort = ({
  datasourceSort,
  sortModel,
}: {
  datasourceSort: Pick<TableDataGridFetcherParams, 'sortColumnKey' | 'sortColumnOrder'>
  sortModel?: InfiniteSortModelItem[]
}): Pick<TableDataGridFetcherParams, 'sortColumnKey' | 'sortColumnOrder'> => {
  const [activeSort] = sortModel ?? []
  if (activeSort?.colId && (activeSort.sort === 'asc' || activeSort.sort === 'desc')) {
    return {
      sortColumnKey: activeSort.colId,
      sortColumnOrder: activeSort.sort,
    }
  }

  return datasourceSort
}

export const resolveHasNextPageWhenTotalUnknown = <Row extends Record<string, any>>({
  page,
  pageSize,
  result,
}: {
  page: number
  pageSize: number
  result: TableDataGridFetcherResult<Row>
}): boolean => result.hasMore ?? (
  typeof result.total === 'number'
    ? page * pageSize < result.total
    : result.data.length === pageSize
)

export const getCursorBlock = ({
  cursorMap,
  endRow,
  startRow,
}: {
  cursorMap: Map<number, unknown>
  endRow: number
  startRow: number
}) => {
  const pageSize = endRow - startRow
  const blockIndex = Math.floor(startRow / pageSize)

  return {
    blockIndex,
    cursor: blockIndex > 0 ? cursorMap.get(blockIndex - 1) : undefined,
    pageSize,
  }
}

export const resolveInfiniteLastRow = <Row extends Record<string, any>>({
  result,
  pageSize,
  startRow,
}: {
  result: TableDataGridFetcherResult<Row>
  pageSize: number
  startRow: number
}): number | undefined => {
  if (typeof result.total === 'number') {
    return result.total
  }

  if (result.hasMore) {
    return undefined
  }

  if (result.hasMore === false || result.data.length < pageSize) {
    return startRow + result.data.length
  }

  return undefined
}
