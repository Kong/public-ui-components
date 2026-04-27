import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableHeader,
  AnalyticsDatatablePinnedState,
  AnalyticsDatatableSort,
} from '../types'
import type { ColumnState, GridApi } from 'ag-grid-community'

export const createDefaultAnalyticsDatatableConfig = <Row extends Record<string, any> = Record<string, any>>({
  headers,
  pageSize,
}: {
  headers: Array<AnalyticsDatatableHeader<Row>>
  pageSize: number
}): AnalyticsDatatableConfig => ({
  columnOrder: headers.map(header => header.key),
  columnVisibility: headers.reduce<Record<string, boolean>>((acc, header) => {
    acc[header.key] = true
    return acc
  }, {}),
  columnWidths: {},
  pinnedColumns: {},
  pageSize,
})

export const getSortKey = (sort: AnalyticsDatatableConfig['sort']): string => {
  if (!sort) {
    return ''
  }

  return `${sort.key}:${sort.order}`
}

export const createResolvedTableConfig = <Row extends Record<string, any>>({
  config,
  headers,
  pageSize,
}: {
  config?: AnalyticsDatatableConfig
  headers: Array<AnalyticsDatatableHeader<Row>>
  pageSize: number
}): AnalyticsDatatableConfig => {
  const defaults = createDefaultAnalyticsDatatableConfig({ headers, pageSize })
  const headerKeys = new Set(headers.map(header => header.key))
  const normalized = normalizeTableConfig(config)

  return {
    columnOrder: mergeColumnOrder(normalized.columnOrder ?? [], defaults.columnOrder ?? []),
    columnVisibility: resolveColumnVisibility(normalized, headers),
    columnWidths: resolveColumnWidths(normalized, headerKeys),
    pinnedColumns: resolvePinnedColumns(normalized, headerKeys),
    sort: resolveSort(normalized, headerKeys),
    pageSize: normalized.pageSize ?? pageSize,
  }
}

export const normalizeTableConfig = (
  config?: Partial<AnalyticsDatatableConfig>,
): AnalyticsDatatableConfig => ({
  columnOrder: [...(config?.columnOrder ?? [])],
  columnVisibility: { ...(config?.columnVisibility ?? {}) },
  columnWidths: { ...(config?.columnWidths ?? {}) },
  pinnedColumns: { ...(config?.pinnedColumns ?? {}) },
  sort: config?.sort,
  pageSize: config?.pageSize,
})

const resolveColumnVisibility = <Row extends Record<string, any>>(
  config: AnalyticsDatatableConfig,
  headers: Array<AnalyticsDatatableHeader<Row>>,
): Record<string, boolean> => {
  const headerKeys = new Set(headers.map(header => header.key))
  const defaults = headers.reduce<Record<string, boolean>>((acc, header) => {
    acc[header.key] = true
    return acc
  }, {})

  return {
    ...defaults,
    ...filterRecordByKeys(config.columnVisibility, headerKeys),
  }
}

const resolveColumnWidths = <Row extends Record<string, any>>(
  config: AnalyticsDatatableConfig,
  headersOrKeys: Array<AnalyticsDatatableHeader<Row>> | Set<string>,
): Record<string, number> => filterRecordByKeys(
  config.columnWidths,
  getHeaderKeySet(headersOrKeys),
)

const resolvePinnedColumns = <Row extends Record<string, any>>(
  config: AnalyticsDatatableConfig,
  headersOrKeys: Array<AnalyticsDatatableHeader<Row>> | Set<string>,
): Record<string, AnalyticsDatatablePinnedState> => filterRecordByKeys(
  config.pinnedColumns,
  getHeaderKeySet(headersOrKeys),
)

const resolveSort = <Row extends Record<string, any>>(
  config: AnalyticsDatatableConfig,
  headersOrKeys: Array<AnalyticsDatatableHeader<Row>> | Set<string>,
): AnalyticsDatatableSort | undefined => {
  const headerKeys = getHeaderKeySet(headersOrKeys)

  return config.sort && headerKeys.has(config.sort.key) ? config.sort : undefined
}

export const normalizedTableConfigsEqual = (
  left: AnalyticsDatatableConfig,
  right: AnalyticsDatatableConfig,
): boolean => (
  arraysEqual(left.columnOrder ?? [], right.columnOrder ?? [])
    && recordsEqual(left.columnVisibility ?? {}, right.columnVisibility ?? {})
    && recordsEqual(left.columnWidths ?? {}, right.columnWidths ?? {})
    && pinnedColumnsEqual(left.pinnedColumns ?? {}, right.pinnedColumns ?? {})
    && sortEqual(left.sort, right.sort)
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

const arraysEqual = <Value>(a: Value[], b: Value[]): boolean => (
  a.length === b.length && a.every((value, index) => value === b[index])
)

const recordsEqual = <Value>(
  a: Record<string, Value>,
  b: Record<string, Value>,
): boolean => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  return aKeys.length === bKeys.length && aKeys.every(key => a[key] === b[key])
}

const sortEqual = (
  a: AnalyticsDatatableSort | undefined,
  b: AnalyticsDatatableSort | undefined,
): boolean => a?.key === b?.key && a?.order === b?.order

const pinnedColumnsEqual = (
  a: Record<string, AnalyticsDatatablePinnedState>,
  b: Record<string, AnalyticsDatatablePinnedState>,
): boolean => recordsEqual(
  filterPinnedColumns(a),
  filterPinnedColumns(b),
)

const filterPinnedColumns = (
  pinnedColumns: Record<string, AnalyticsDatatablePinnedState>,
): Record<string, Exclude<AnalyticsDatatablePinnedState, false>> => (
  Object.entries(pinnedColumns).reduce<Record<string, Exclude<AnalyticsDatatablePinnedState, false>>>((acc, [key, value]) => {
    if (value) {
      acc[key] = value
    }

    return acc
  }, {})
)

const filterRecordByKeys = <Value>(
  record: Record<string, Value> | undefined,
  keys: Set<string>,
): Record<string, Value> => {
  if (!record) {
    return {}
  }

  return Object.entries(record).reduce<Record<string, Value>>((acc, [key, value]) => {
    if (keys.has(key)) {
      acc[key] = value
    }
    return acc
  }, {})
}

const getHeaderKeySet = <Row extends Record<string, any>>(
  headersOrKeys: Array<AnalyticsDatatableHeader<Row>> | Set<string>,
): Set<string> => headersOrKeys instanceof Set
  ? headersOrKeys
  : new Set(headersOrKeys.map(header => header.key))

export const buildColumnStateFromConfig = <Row extends Record<string, any>>({
  config,
  headers,
  isColumnOrderResolved = false,
}: {
  config: AnalyticsDatatableConfig
  headers: Array<AnalyticsDatatableHeader<Row>>
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
      sort: config.sort?.key === key ? config.sort.order : null,
    }
  })
}

export const getConfigFromGrid = <Row extends Record<string, any>>({
  api,
  headers,
  pageSize,
}: {
  api: GridApi
  headers: Array<AnalyticsDatatableHeader<Row>>
  pageSize: number
}): AnalyticsDatatableConfig => {
  const headerKeys = new Set(headers.map(header => header.key))
  const columnState = api.getColumnState().filter(column => headerKeys.has(column.colId))
  const sortColumn = columnState.find(column => column.sort)
  const sort: AnalyticsDatatableSort | undefined = sortColumn?.colId && sortColumn.sort
    ? { key: sortColumn.colId, order: sortColumn.sort as AnalyticsDatatableSort['order'] }
    : undefined

  return {
    columnOrder: columnState.map(column => column.colId).filter(Boolean),
    columnVisibility: columnState.reduce<Record<string, boolean>>((acc, column) => {
      acc[column.colId] = !column.hide
      return acc
    }, {}),
    columnWidths: columnState.reduce<Record<string, number>>((acc, column) => {
      if (typeof column.width === 'number') {
        acc[column.colId] = column.width
      }
      return acc
    }, {}),
    pinnedColumns: columnState.reduce<Record<string, AnalyticsDatatablePinnedState>>((acc, column) => {
      acc[column.colId] = column.pinned === 'left' || column.pinned === 'right' ? column.pinned : false
      return acc
    }, {}),
    sort,
    pageSize,
  }
}
