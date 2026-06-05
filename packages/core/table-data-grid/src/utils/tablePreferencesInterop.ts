import type { TableDataGridConfig } from '../types'
import type { TablePreferences, TableSortPayload } from '@kong/kongponents'
import { getColumnVisibility, getColumnWidths } from './tableConfig'

const compactRecord = <Value>(
  record: Partial<Record<string, Value>> | undefined,
): Record<string, Value> => {
  if (!record) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, Value] => entry[1] !== undefined),
  )
}

export const toTableDataGridConfig = (
  tablePreferences?: TablePreferences,
): TableDataGridConfig => {
  const columnWidths = compactRecord(tablePreferences?.columnWidths)
  const columnVisibility = compactRecord(tablePreferences?.columnVisibility)
  const columnKeys = new Set([
    ...Object.keys(columnWidths),
    ...Object.keys(columnVisibility),
  ])

  return {
    pageSize: tablePreferences?.pageSize,
    sortColumnKey: tablePreferences?.sortColumnKey || undefined,
    sortColumnOrder: tablePreferences?.sortColumnOrder,
    columns: Object.fromEntries(Array.from(columnKeys).map(key => [
      key,
      {
        ...(typeof columnVisibility[key] === 'boolean' ? { visible: columnVisibility[key] } : {}),
        ...(typeof columnWidths[key] === 'number' ? { width: columnWidths[key] } : {}),
      },
    ])),
  }
}

export const toTablePreferences = (
  tableDataGridConfig?: TableDataGridConfig,
): TablePreferences => ({
  pageSize: tableDataGridConfig?.pageSize,
  sortColumnKey: tableDataGridConfig?.sortColumnKey || undefined,
  sortColumnOrder: tableDataGridConfig?.sortColumnOrder,
  columnWidths: getColumnWidths(tableDataGridConfig ?? {}),
  columnVisibility: getColumnVisibility(tableDataGridConfig ?? {}),
})

export const toTableSortPayload = (
  tableDataGridConfig: TableDataGridConfig,
  previousTablePreferences?: TablePreferences,
): TableSortPayload => ({
  prevKey: previousTablePreferences?.sortColumnKey || '',
  sortColumnKey: tableDataGridConfig.sortColumnKey || '',
  sortColumnOrder: tableDataGridConfig.sortColumnKey
    ? tableDataGridConfig.sortColumnOrder ?? previousTablePreferences?.sortColumnOrder ?? 'asc'
    : 'asc',
})
