import type { TableDataGridHeader } from '../types'

export const isColumnHideable = <Row extends Record<string, any>>(
  header: TableDataGridHeader<Row>,
): boolean => header.hideable ?? true
