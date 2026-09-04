import type { TableDataGridConfig, TableDataGridHeader, TableDataGridRow } from '../types'

/**
 * Resolves a host-supplied (or absent) `tableConfig` into a config the
 * component can trust: drops a `sortColumnKey` that no longer matches a
 * `sortable` header, and falls back `pageSize` to the component default.
 *
 * @param config Host-supplied table config, or `undefined` when uncontrolled.
 * @param headers Current column headers, used to validate the sort key.
 * @param pageSize Component-level page size default.
 * @returns A fully-resolved `TableDataGridConfig`.
 */
export const resolveTableConfig = <Row extends object = TableDataGridRow>({
  config,
  headers,
  pageSize,
}: {
  config: TableDataGridConfig | undefined
  headers: Array<TableDataGridHeader<Row>>
  pageSize: number
}): TableDataGridConfig => {
  const sortableKeys = new Set<string>(headers.filter(header => header.sortable).map(header => header.key))
  const sortColumnKey = config?.sortColumnKey && sortableKeys.has(config.sortColumnKey)
    ? config.sortColumnKey
    : undefined

  return {
    sortColumnKey,
    sortColumnOrder: sortColumnKey ? config?.sortColumnOrder : undefined,
    pageSize: config?.pageSize ?? pageSize,
  }
}

/**
 * Structural equality for two resolved `TableDataGridConfig` values.
 *
 * @param a First config to compare.
 * @param b Second config to compare.
 * @returns Whether every field matches, including `undefined` values.
 */
export const tableConfigsEqual = (a: TableDataGridConfig, b: TableDataGridConfig): boolean => (
  a.sortColumnKey === b.sortColumnKey
  && a.sortColumnOrder === b.sortColumnOrder
  && a.pageSize === b.pageSize
)
