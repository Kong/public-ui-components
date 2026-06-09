import type { TableDataGridHeader } from '../types'
import type { FilterGroupFilters } from '@kong/kongponents'

export const getFilterSlotName = (filterKey: string) => `filter-${filterKey}`

export const getFilterGroupFilters = <Row extends Record<string, any>>(
  headers: Array<TableDataGridHeader<Row>>,
): FilterGroupFilters => Object.fromEntries(
  headers
    .filter(header => header.filter)
    .map(header => [header.key, header.filter]),
) as FilterGroupFilters

export const isColumnHideable = <Row extends Record<string, any>>(
  header: TableDataGridHeader<Row>,
): boolean => header.hideable ?? true
