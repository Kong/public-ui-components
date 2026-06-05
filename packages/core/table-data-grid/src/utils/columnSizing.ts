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

type FitColumnWidth = {
  key: string
  newWidth: number
}

type ConstrainedFitColumn = {
  key: string
  maxWidth?: number
  minWidth: number
  width: number
}

type ColumnWidthLimits = {
  maxWidth?: number
  minWidth: number
}

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

const clampColumnWidth = (
  width: number,
  {
    maxWidth,
    minWidth,
  }: ColumnWidthLimits,
) => Math.min(Math.max(width, minWidth), maxWidth ?? Number.POSITIVE_INFINITY)

const distributeConstrainedWidths = ({
  columns,
  targetWidth,
}: {
  columns: ConstrainedFitColumn[]
  targetWidth: number
}) => {
  const widths = columns.map(column => clampColumnWidth(column.width, column))
  let remainingDelta = targetWidth - widths.reduce((total, width) => total + width, 0)

  for (let pass = 0; pass < columns.length && Math.abs(remainingDelta) >= 0.5; pass += 1) {
    const candidateIndexes = widths
      .map((width, index) => ({ index, width }))
      .filter(({ index, width }) => (
        remainingDelta > 0
          ? width < (columns[index].maxWidth ?? Number.POSITIVE_INFINITY)
          : width > columns[index].minWidth
      ))

    if (!candidateIndexes.length) {
      break
    }

    const candidateWidthTotal = candidateIndexes.reduce((total, { width }) => total + width, 0)
    let consumedDelta = 0

    candidateIndexes.forEach(({ index, width }) => {
      const proportionalDelta = candidateWidthTotal > 0
        ? remainingDelta * (width / candidateWidthTotal)
        : remainingDelta / candidateIndexes.length
      const nextWidth = clampColumnWidth(width + proportionalDelta, columns[index])
      consumedDelta += nextWidth - width
      widths[index] = nextWidth
    })

    if (Math.abs(consumedDelta) < 0.5) {
      break
    }

    remainingDelta -= consumedDelta
  }

  return widths
}

const roundConstrainedWidths = ({
  columns,
  targetWidth,
  widths,
}: {
  columns: ConstrainedFitColumn[]
  targetWidth: number
  widths: number[]
}) => {
  const roundedWidths = widths.map(width => Math.floor(width))
  let remainingPixels = Math.round(targetWidth - roundedWidths.reduce((total, width) => total + width, 0))

  while (remainingPixels !== 0) {
    const direction = remainingPixels > 0 ? 1 : -1
    const candidateIndex = roundedWidths.findIndex((width, index) => (
      direction > 0
        ? width < (columns[index].maxWidth ?? Number.POSITIVE_INFINITY)
        : width > columns[index].minWidth
    ))

    if (candidateIndex === -1) {
      break
    }

    roundedWidths[candidateIndex] += direction
    remainingPixels -= direction
  }

  return roundedWidths
}

const getRenderedCenterViewportWidth = (datatableElement?: HTMLElement) => {
  const viewport = datatableElement?.querySelector<HTMLElement>('.ag-center-cols-viewport')

  return viewport?.clientWidth || undefined
}

export const getAvailableFitWidth = <Row extends Record<string, any>>({
  api,
  columnState,
  datatableElement,
}: {
  api: GridApi<Row>
  columnState: ColumnState[]
  datatableElement?: HTMLElement
}) => {
  const horizontalPixelRange = api.getHorizontalPixelRange()
  if (!horizontalPixelRange) {
    return undefined
  }

  const { left, right } = horizontalPixelRange
  return (getRenderedCenterViewportWidth(datatableElement) ?? right - left) + getDisplayedPinnedColumnWidth(columnState)
}

export const createConstrainedFitColumnWidths = <Row extends Record<string, any>>({
  availableWidth,
  columnState,
  headers,
}: {
  availableWidth: number
  columnState: ColumnState[]
  headers: Array<TableDataGridHeader<Row>>
}): FitColumnWidth[] | undefined => {
  const headerByKey = new Map(headers.map(header => [header.key, header]))
  const displayedColumns = columnState.filter(column => !column.hide)
  const nonHeaderWidth = getDisplayedColumnWidth(displayedColumns, column => !headerByKey.has(column.colId))
  const targetHeaderWidth = availableWidth - nonHeaderWidth
  const fitColumns = displayedColumns.flatMap((column): ConstrainedFitColumn[] => {
    const header = headerByKey.get(column.colId)
    if (!header) {
      return []
    }

    return [{
      key: column.colId,
      maxWidth: header.maxWidth,
      minWidth: getColumnFitMinWidth(header),
      width: column.width ?? getColumnFitMinWidth(header),
    }]
  })

  if (targetHeaderWidth <= 0 || !fitColumns.length) {
    return undefined
  }

  const widths = distributeConstrainedWidths({
    columns: fitColumns,
    targetWidth: targetHeaderWidth,
  })
  const roundedWidths = roundConstrainedWidths({
    columns: fitColumns,
    targetWidth: targetHeaderWidth,
    widths,
  })

  return fitColumns.map((column, index) => ({
    key: column.key,
    newWidth: roundedWidths[index],
  }))
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
