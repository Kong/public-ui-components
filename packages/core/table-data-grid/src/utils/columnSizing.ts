import type {
  TableDataGridConfig,
  TableDataGridHeader,
} from '../types'
import type { GridColumnWidthChangeSource } from '../types/internal'
import type {
  ColumnState,
  GridApi,
  ISizeColumnsToFitParams,
} from 'ag-grid-community'

const DEFAULT_AUTO_FIT_MIN_WIDTH = 120

const getColumnFitMinWidth = <Row extends Record<string, any>>(
  header: TableDataGridHeader<Row>,
) => header.minWidth ?? DEFAULT_AUTO_FIT_MIN_WIDTH

export const createColumnFitParams = <Row extends Record<string, any>>({
  headers,
}: {
  headers: Array<TableDataGridHeader<Row>>
}): ISizeColumnsToFitParams => ({
  columnLimits: headers.map(header => ({
    key: header.key,
    minWidth: getColumnFitMinWidth(header),
    maxWidth: header.maxWidth,
  })),
})

const getDisplayedColumnWidth = (
  columnState: ColumnState[],
  predicate: (column: ColumnState) => boolean,
) => {
  return columnState
    .filter(column => !column.hide && predicate(column))
    .reduce((total, column) => total + (column.width ?? 0), 0)
}

const getDisplayedPinnedColumnWidth = (columnState: ColumnState[]) => (
  getDisplayedColumnWidth(columnState, column => column.pinned === 'left' || column.pinned === 'right')
)

export const getAvailableFitWidth = <Row extends Record<string, any>>({
  api,
  columnState,
}: {
  api: GridApi<Row>
  columnState: ColumnState[]
}) => {
  const horizontalPixelRange = api.getHorizontalPixelRange()
  if (!horizontalPixelRange) {
    return undefined
  }

  const { left, right } = horizontalPixelRange
  return right - left + getDisplayedPinnedColumnWidth(columnState)
}

const getRequiredHeaderWidth = <Row extends Record<string, any>>(
  header: TableDataGridHeader<Row>,
  {
    honorConfiguredColumnWidths,
    resolvedTableConfig,
  }: {
    honorConfiguredColumnWidths: boolean
    resolvedTableConfig: TableDataGridConfig
  },
) => {
  const minWidth = getColumnFitMinWidth(header)
  const configuredWidth = honorConfiguredColumnWidths
    ? resolvedTableConfig.columnWidths?.[header.key] ?? header.width
    : undefined

  return Math.max(configuredWidth ?? minWidth, minWidth)
}

const getRequiredVisibleHeaderWidth = <Row extends Record<string, any>>({
  headers,
  honorConfiguredColumnWidths,
  resolvedTableConfig,
}: {
  headers: Array<TableDataGridHeader<Row>>
  honorConfiguredColumnWidths: boolean
  resolvedTableConfig: TableDataGridConfig
}) => {
  return headers
    .filter(header => resolvedTableConfig.columnVisibility?.[header.key] !== false)
    .reduce((total, header) => total + getRequiredHeaderWidth(header, {
      honorConfiguredColumnWidths,
      resolvedTableConfig,
    }), 0)
}

const getRequiredNonHeaderColumnWidth = ({
  columnState,
  headerKeys,
}: {
  columnState: ColumnState[]
  headerKeys: Set<string>
}) => (
  getDisplayedColumnWidth(columnState, column => !headerKeys.has(column.colId))
)

const getRequiredFitWidth = <Row extends Record<string, any>>({
  columnState,
  headers,
  honorConfiguredColumnWidths,
  resolvedTableConfig,
}: {
  columnState: ColumnState[]
  headers: Array<TableDataGridHeader<Row>>
  honorConfiguredColumnWidths: boolean
  resolvedTableConfig: TableDataGridConfig
}) => (
  getRequiredVisibleHeaderWidth({
    headers,
    honorConfiguredColumnWidths,
    resolvedTableConfig,
  }) + getRequiredNonHeaderColumnWidth({
    columnState,
    headerKeys: new Set(headers.map(header => header.key)),
  })
)

export const canDisplayedColumnsFit = <Row extends Record<string, any>>({
  availableWidth,
  columnState,
  headers,
  honorConfiguredColumnWidths,
  resolvedTableConfig,
}: {
  availableWidth: number
  columnState: ColumnState[]
  headers: Array<TableDataGridHeader<Row>>
  honorConfiguredColumnWidths: boolean
  resolvedTableConfig: TableDataGridConfig
}) => {
  return availableWidth <= 0 || getRequiredFitWidth({
    columnState,
    headers,
    honorConfiguredColumnWidths,
    resolvedTableConfig,
  }) <= availableWidth
}

export const getConfigForColumnWidthChangeDetection = ({
  columnWidthChangeSource,
  gridConfig,
  resolvedTableConfig,
}: {
  columnWidthChangeSource: GridColumnWidthChangeSource
  gridConfig: TableDataGridConfig
  resolvedTableConfig: TableDataGridConfig
}): TableDataGridConfig => {
  if (columnWidthChangeSource === 'intentional') {
    return gridConfig
  }

  return {
    ...gridConfig,
    columnWidths: resolvedTableConfig.columnWidths,
  }
}
