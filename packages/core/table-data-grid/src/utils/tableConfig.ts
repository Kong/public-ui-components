import type {
  TableDataGridConfig,
  TableDataGridHeader,
  TableDataGridPinnedState,
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
  columnVisibility: Object.fromEntries(headers.map(header => [header.key, true])),
  columnWidths: {},
  pinnedColumns: {},
  pageSize,
})

export const getSortKey = (config: Pick<TableDataGridConfig, 'sortColumnKey' | 'sortColumnOrder'>): string => {
  if (!config.sortColumnKey || !config.sortColumnOrder) {
    return ''
  }

  return `${config.sortColumnKey}:${config.sortColumnOrder}`
}

export const hasConfiguredColumnWidths = (config: TableDataGridConfig): boolean => (
  Object.keys(config.columnWidths ?? {}).length > 0
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
    columnVisibility: resolveColumnVisibility(normalized, headers),
    columnWidths: resolveColumnWidths(normalized, headerKeys),
    pinnedColumns: resolvePinnedColumns(normalized, headerKeys),
    ...resolveSort(normalized, headerKeys),
    pageSize: normalized.pageSize ?? pageSize,
  }
}

export const normalizeTableConfig = (
  config?: Partial<TableDataGridConfig>,
): TableDataGridConfig => ({
  columnOrder: [...(config?.columnOrder ?? [])],
  columnVisibility: { ...(config?.columnVisibility ?? {}) },
  columnWidths: { ...(config?.columnWidths ?? {}) },
  pinnedColumns: { ...(config?.pinnedColumns ?? {}) },
  sortColumnKey: config?.sortColumnKey,
  sortColumnOrder: config?.sortColumnOrder,
  pageSize: config?.pageSize,
})

const resolveColumnVisibility = <Row extends Record<string, any>>(
  config: TableDataGridConfig,
  headers: Array<TableDataGridHeader<Row>>,
): Record<string, boolean> => {
  const headerKeys = new Set(headers.map(header => header.key))
  const defaults = Object.fromEntries(headers.map(header => [header.key, true]))

  const configuredVisibility = filterRecordByKeys(config.columnVisibility, headerKeys)

  return headers.reduce<Record<string, boolean>>((acc, header) => {
    acc[header.key] = isColumnHideable(header) ? configuredVisibility[header.key] ?? defaults[header.key] : true
    return acc
  }, {})
}

const resolveColumnWidths = <Row extends Record<string, any>>(
  config: TableDataGridConfig,
  headersOrKeys: Array<TableDataGridHeader<Row>> | Set<string>,
): Record<string, number> => filterRecordByKeys(
  config.columnWidths,
  getHeaderKeySet(headersOrKeys),
)

const resolvePinnedColumns = <Row extends Record<string, any>>(
  config: TableDataGridConfig,
  headersOrKeys: Array<TableDataGridHeader<Row>> | Set<string>,
): Record<string, TableDataGridPinnedState> => filterRecordByKeys(
  config.pinnedColumns,
  getHeaderKeySet(headersOrKeys),
)

const resolveSort = <Row extends Record<string, any>>(
  config: TableDataGridConfig,
  headersOrKeys: Array<TableDataGridHeader<Row>> | Set<string>,
): Pick<TableDataGridConfig, 'sortColumnKey' | 'sortColumnOrder'> => {
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
 * only the synced config fields, and so explicit pinnedColumns false entries stay
 * meaningful: false unpins a header that may otherwise be pinned by default.
 */
export const normalizedTableConfigsEqual = (
  left: TableDataGridConfig,
  right: TableDataGridConfig,
): boolean => (
  isEqual(left.columnOrder ?? [], right.columnOrder ?? [])
    && isEqual(left.columnVisibility ?? {}, right.columnVisibility ?? {})
    && isEqual(left.columnWidths ?? {}, right.columnWidths ?? {})
    && isEqual(left.pinnedColumns ?? {}, right.pinnedColumns ?? {})
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
  const columnWidths = config.columnWidths ?? {}
  const columnVisibility = config.columnVisibility ?? {}
  const pinnedColumns = config.pinnedColumns ?? {}
  const headersByKey = new Map(headers.map(header => [header.key, header]))
  const orderedKeys = isColumnOrderResolved
    ? columnOrder
    : mergeColumnOrder(columnOrder, headers.map(header => header.key))

  return orderedKeys.map((key) => {
    const header = headersByKey.get(key)
    const width = columnWidths[key] ?? header?.width
    const pinned = pinnedColumns[key] ?? header?.pinned
    const visible = columnVisibility[key]

    return {
      colId: key,
      hide: typeof visible === 'boolean' ? !visible : undefined,
      width,
      pinned: pinned || null,
      sort: config.sortColumnKey === key && config.sortColumnOrder ? config.sortColumnOrder : null,
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
    columnVisibility: Object.fromEntries(columnState.map(column => [column.colId, !column.hide])),
    columnWidths: Object.fromEntries(columnState
      .filter(column => typeof column.width === 'number')
      .map(column => [column.colId, column.width as number])),
    pinnedColumns: Object.fromEntries(columnState.map(column => [
      column.colId,
      column.pinned === 'left' || column.pinned === 'right' ? column.pinned : false,
    ])),
    sortColumnKey: sortColumn?.colId,
    sortColumnOrder: sortColumn?.sort === 'asc' || sortColumn?.sort === 'desc' ? sortColumn.sort : undefined,
    pageSize,
  }
}
