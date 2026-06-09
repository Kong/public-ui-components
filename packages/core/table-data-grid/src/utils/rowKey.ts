import type { TableDataGridRowKey } from '../types'

export const getRowKeyValue = <Row extends Record<string, any>>(
  row: Row,
  rowKey: TableDataGridRowKey<Row>,
): string => String(row[rowKey] ?? '')
