import type {
  TableDataGridColumnConfig,
  TableDataGridConfig,
  TableDataGridHeader,
  TableDataGridPinnedState,
  TableDataGridSort,
} from '../types'
import type { ColumnState, GridApi } from 'ag-grid-community'
import isEqual from 'lodash-es/isEqual'
import { isColumnHideable } from './headers'

export const createDefaultTableDataGridConfig = <Row extends Record<string, any> = Record<string, any>>({
  headers,
  pageSize,
}: {
  headers: Array<TableDataGridHeader<Row>>
  pageSize: number
}): TableDataGridConfig => ({
  columnOrder: headers.map(header => header.key),
  columns: Object.fromEntries(headers.map(header => [
    header.key,
    { visible: getDefaultColumnVisibility(header) },
  ])),
  pageSize,
})

export const getSortKey = (config: TableDataGridSort): string => {
  if (!config.sortColumnKey || !config.sortColumnOrder) {
    return ''
  }

  return `${config.sortColumnKey}:${config.sortColumnOrder}`
}

export const hasConfiguredColumnWidths = (config: TableDataGridConfig): boolean => (
  Object.values(config.columns ?? {}).some(column => typeof column.width === 'number')
)

export const createResolvedTableConfig = <Row extends Record<string, any>>({
  config,
  headers,
  pageSize,
}: {
  config?: TableDataGridConfig
  headers: Array<TableDataGridHeader<Row>>
  pageSize: number
}): TableDataGridConfig => {
  const defaults = createDefaultTableDataGridConfig({ headers, pageSize })
  const headerKeys = new Set(headers.map(header => header.key))
  const normalized = normalizeTableConfig(config)

  return {
    columnOrder: mergeColumnOrder(normalized.columnOrder ?? [], defaults.columnOrder ?? []),
    columns: resolveColumns(normalized, headers),
    ...resolveSort(normalized, headerKeys),
    pageSize: normalized.pageSize ?? pageSize,
  }
}

export const normalizeTableConfig = (
  config?: Partial<TableDataGridConfig>,
): TableDataGridConfig => ({
  columnOrder: [...(config?.columnOrder ?? [])],
  columns: cloneColumns(config?.columns),
  sortColumnKey: config?.sortColumnKey,
  sortColumnOrder: config?.sortColumnOrder,
  pageSize: config?.pageSize,
})

const resolveColumns = <Row extends Record<string, any>>(
  config: TableDataGridConfig,
  headers: Array<TableDataGridHeader<Row>>,
): Record<string, TableDataGridColumnConfig> => {
  const headerKeys = new Set(headers.map(header => header.key))
  const configuredColumns = filterRecordByKeys(config.columns, headerKeys)

  return headers.reduce<Record<string, TableDataGridColumnConfig>>((acc, header) => {
    const configuredColumn = configuredColumns[header.key] ?? {}
    acc[header.key] = {
      ...configuredColumn,
      visible: resolveColumnVisibility({
        configuredColumn,
        header,
      }),
    }
    return acc
  }, {})
}

const getDefaultColumnVisibility = <Row extends Record<string, any>>(
  header: TableDataGridHeader<Row>,
) => isColumnHideable(header) ? header.visible ?? true : true

const resolveColumnVisibility = <Row extends Record<string, any>>({
  configuredColumn,
  header,
}: {
  configuredColumn: TableDataGridColumnConfig
  header: TableDataGridHeader<Row>
}) => (
  isColumnHideable(header) ? configuredColumn.visible ?? getDefaultColumnVisibility(header) : true
)

const resolveSort = <Row extends Record<string, any>>(
  config: TableDataGridConfig,
  headersOrKeys: Array<TableDataGridHeader<Row>> | Set<string>,
): TableDataGridSort => {
  const headerKeys = getHeaderKeySet(headersOrKeys)
  const sortColumnKey = config.sortColumnKey || undefined

  if (sortColumnKey && config.sortColumnOrder && headerKeys.has(sortColumnKey)) {
    return {
      sortColumnKey,
      sortColumnOrder: config.sortColumnOrder,
    }
  }

  return {
    sortColumnKey: undefined,
    sortColumnOrder: undefined,
  }
}

/**
 * Guards controlled tableConfig updates from feeding AG Grid state changes back
 * into the parent when the persisted config is already structurally identical.
 * Reference equality is not enough because every normalization/grid read creates
 * fresh arrays and records. Keep this wrapper around isEqual so callers compare
 * only the synced config fields, and so explicit pinned false entries stay
 * meaningful: false unpins a header that may otherwise be pinned by default.
 */
export const normalizedTableConfigsEqual = (
  left: TableDataGridConfig,
  right: TableDataGridConfig,
): boolean => (
  isEqual(left.columnOrder ?? [], right.columnOrder ?? [])
    && isEqual(left.columns ?? {}, right.columns ?? {})
    && left.sortColumnKey === right.sortColumnKey
    && left.sortColumnOrder === right.sortColumnOrder
    && left.pageSize === right.pageSize
)

export const mergeColumnOrder = (
  configOrder: string[],
  allKeys: string[],
): string[] => {
  const allKeySet = new Set(allKeys)
  const providedOrder = Array.from(new Set(configOrder.filter(key => allKeySet.has(key))))
  const providedOrderSet = new Set(providedOrder)

  return [
    ...providedOrder,
    ...allKeys.filter(key => !providedOrderSet.has(key)),
  ]
}

const filterRecordByKeys = <Value>(
  record: Record<string, Value> | undefined,
  keys: Set<string>,
): Record<string, Value> => {
  if (!record) {
    return {}
  }

  return Object.fromEntries(Object.entries(record).filter(([key]) => keys.has(key)))
}

const getHeaderKeySet = <Row extends Record<string, any>>(
  headersOrKeys: Array<TableDataGridHeader<Row>> | Set<string>,
): Set<string> => headersOrKeys instanceof Set
  ? headersOrKeys
  : new Set(headersOrKeys.map(header => header.key))

const cloneColumns = (
  columns?: Record<string, TableDataGridColumnConfig>,
): Record<string, TableDataGridColumnConfig> => (
  Object.fromEntries(Object.entries(columns ?? {}).map(([key, column]) => [key, { ...column }]))
)

export const getColumnVisibility = (
  config: TableDataGridConfig,
): Record<string, boolean> => (
  Object.fromEntries(
    Object.entries(config.columns ?? {})
      .filter((entry): entry is [string, TableDataGridColumnConfig & { visible: boolean }] => (
        typeof entry[1].visible === 'boolean'
      ))
      .map(([key, column]) => [key, column.visible]),
  )
)

export const getColumnWidths = (
  config: TableDataGridConfig,
): Record<string, number> => (
  Object.fromEntries(
    Object.entries(config.columns ?? {})
      .filter((entry): entry is [string, TableDataGridColumnConfig & { width: number }] => (
        typeof entry[1].width === 'number'
      ))
      .map(([key, column]) => [key, column.width]),
  )
)

const getColumnStateHide = (visible?: boolean) => (
  typeof visible === 'boolean' ? !visible : undefined
)

const getColumnStatePinned = (pinned?: TableDataGridPinnedState) => (
  pinned || null
)

const getColumnStateSort = ({
  columnKey,
  config,
}: {
  columnKey: string
  config: TableDataGridConfig
}) => (
  config.sortColumnKey === columnKey && config.sortColumnOrder ? config.sortColumnOrder : null
)

export const buildColumnStateFromConfig = <Row extends Record<string, any>>({
  config,
  headers,
  isColumnOrderResolved = false,
}: {
  config: TableDataGridConfig
  headers: Array<TableDataGridHeader<Row>>
  isColumnOrderResolved?: boolean
}): ColumnState[] => {
  const columnOrder = config.columnOrder ?? []
  const columns = config.columns ?? {}
  const headersByKey = new Map(headers.map(header => [header.key, header]))
  const orderedKeys = isColumnOrderResolved
    ? columnOrder
    : mergeColumnOrder(columnOrder, headers.map(header => header.key))

  return orderedKeys.map((key) => {
    const header = headersByKey.get(key)
    const column = columns[key] ?? {}
    const width = column.width ?? header?.width
    const pinned = column.pinned ?? header?.pinned
    const visible = column.visible

    return {
      colId: key,
      hide: getColumnStateHide(visible),
      width,
      pinned: getColumnStatePinned(pinned),
      sort: getColumnStateSort({
        columnKey: key,
        config,
      }),
    }
  })
}

export const getConfigFromGrid = <Row extends Record<string, any>>({
  api,
  headers,
  pageSize,
}: {
  api: GridApi
  headers: Array<TableDataGridHeader<Row>>
  pageSize: number
}): TableDataGridConfig => {
  const headerKeys = new Set(headers.map(header => header.key))
  const columnState = api.getColumnState().filter(column => headerKeys.has(column.colId))
  const sortColumn = columnState.find(column => column.sort)

  return {
    columnOrder: columnState.map(column => column.colId).filter(Boolean),
    columns: Object.fromEntries(columnState.map(column => [column.colId, {
      visible: !column.hide,
      ...(typeof column.width === 'number' ? { width: column.width } : {}),
      pinned: column.pinned === 'left' || column.pinned === 'right' ? column.pinned : false,
    }])),
    sortColumnKey: sortColumn?.colId,
    sortColumnOrder: sortColumn?.sort === 'asc' || sortColumn?.sort === 'desc' ? sortColumn.sort : undefined,
    pageSize,
  }
}
