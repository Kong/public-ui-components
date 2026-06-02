import type {
  TableDataGridConfig,
  TableDataGridMode,
  TableDataGridRowSelectionMode,
  TableDataGridSort,
} from '../types'
import isEqual from 'lodash-es/isEqual'
import { getSortKey } from './tableConfig'

export const createLayoutSnapshot = (config: TableDataGridConfig): TableDataGridConfig => ({
  columnOrder: config.columnOrder,
  columnVisibility: config.columnVisibility,
  columnWidths: config.columnWidths,
  pinnedColumns: config.pinnedColumns,
  sortColumnKey: undefined,
  sortColumnOrder: undefined,
  pageSize: undefined,
})

export const createRefreshParamsForConfigChange = ({
  mode,
  nextConfig,
  previousConfig,
}: {
  mode: TableDataGridMode
  nextConfig: TableDataGridConfig
  previousConfig: TableDataGridConfig
}): Partial<TableDataGridSort & { pageSize: number }> | undefined => {
  const sortChanged = getSortKey(nextConfig) !== getSortKey(previousConfig)
  const pageSizeChanged = nextConfig.pageSize !== previousConfig.pageSize
  const shouldRefreshForSort = sortChanged && mode !== 'infinite'

  if (!shouldRefreshForSort && !pageSizeChanged) {
    return undefined
  }

  if (shouldRefreshForSort) {
    const refreshParams: Partial<TableDataGridSort & { pageSize: number }> = {
      sortColumnKey: nextConfig.sortColumnKey,
      sortColumnOrder: nextConfig.sortColumnOrder,
    }

    if (pageSizeChanged && typeof nextConfig.pageSize === 'number') {
      refreshParams.pageSize = nextConfig.pageSize
    }

    return refreshParams
  } else if (typeof nextConfig.pageSize === 'number') {
    return {
      pageSize: nextConfig.pageSize,
    }
  }

  return {}
}

export const hasColumnVisibilityChanged = ({
  nextConfig,
  previousConfig,
}: {
  nextConfig: TableDataGridConfig
  previousConfig: TableDataGridConfig
}) => {
  const nextColumnVisibility = nextConfig.columnVisibility ?? {}
  const previousColumnVisibility = previousConfig.columnVisibility ?? {}
  return !isEqual(nextColumnVisibility, previousColumnVisibility)
}

export const hasSelectionColumn = (selectionMode: TableDataGridRowSelectionMode) => selectionMode === 'multiple'
