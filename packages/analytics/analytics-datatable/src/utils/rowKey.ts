import type { AnalyticsDatatableRowKey } from '../types'

export const getRowKeyValue = <Row extends Record<string, any>>(
  row: Row,
  rowKey: AnalyticsDatatableRowKey<Row>,
): string => String(row[rowKey] ?? '')
