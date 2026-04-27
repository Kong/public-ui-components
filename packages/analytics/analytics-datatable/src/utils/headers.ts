import type { AnalyticsDatatableHeader } from '../types'

export const isColumnHideable = <Row extends Record<string, any>>(
  header: AnalyticsDatatableHeader<Row>,
): boolean => header.hideable ?? true
