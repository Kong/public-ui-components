import type { TableDataGridConfig } from '../types'
import type { TablePreferences, TableSortPayload } from '@kong/kongponents'

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
): TableDataGridConfig => ({
  pageSize: tablePreferences?.pageSize,
  sortColumnKey: tablePreferences?.sortColumnKey || undefined,
  sortColumnOrder: tablePreferences?.sortColumnOrder,
  columnWidths: compactRecord(tablePreferences?.columnWidths),
  columnVisibility: compactRecord(tablePreferences?.columnVisibility),
})

export const toTablePreferences = (
  tableDataGridConfig?: TableDataGridConfig,
): TablePreferences => ({
  pageSize: tableDataGridConfig?.pageSize,
  sortColumnKey: tableDataGridConfig?.sortColumnKey || undefined,
  sortColumnOrder: tableDataGridConfig?.sortColumnOrder,
  columnWidths: { ...(tableDataGridConfig?.columnWidths ?? {}) },
  columnVisibility: { ...(tableDataGridConfig?.columnVisibility ?? {}) },
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
