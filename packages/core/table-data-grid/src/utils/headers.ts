import type { TableDataGridHeader } from '../types'

export const getFilterSlotName = (filterKey: string) => `filter-${filterKey}`

export const isColumnHideable = <Row extends Record<string, any>>(
  header: TableDataGridHeader<Row>,
): boolean => header.hideable ?? true
