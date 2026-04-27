import type { AnalyticsDatatableConfig } from '../types'
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

export const toAnalyticsTableConfig = (
  tablePreferences?: TablePreferences,
): AnalyticsDatatableConfig => ({
  pageSize: tablePreferences?.pageSize,
  sortColumnKey: tablePreferences?.sortColumnKey || undefined,
  sortColumnOrder: tablePreferences?.sortColumnOrder,
  columnWidths: compactRecord(tablePreferences?.columnWidths),
  columnVisibility: compactRecord(tablePreferences?.columnVisibility),
})

export const toTablePreferences = (
  analyticsTableConfig?: AnalyticsDatatableConfig,
): TablePreferences => ({
  pageSize: analyticsTableConfig?.pageSize,
  sortColumnKey: analyticsTableConfig?.sortColumnKey || undefined,
  sortColumnOrder: analyticsTableConfig?.sortColumnOrder,
  columnWidths: { ...(analyticsTableConfig?.columnWidths ?? {}) },
  columnVisibility: { ...(analyticsTableConfig?.columnVisibility ?? {}) },
})

export const toTableSortPayload = (
  analyticsTableConfig: AnalyticsDatatableConfig,
  previousTablePreferences?: TablePreferences,
): TableSortPayload => ({
  prevKey: previousTablePreferences?.sortColumnKey || '',
  sortColumnKey: analyticsTableConfig.sortColumnKey || '',
  sortColumnOrder: analyticsTableConfig.sortColumnKey
    ? analyticsTableConfig.sortColumnOrder ?? previousTablePreferences?.sortColumnOrder ?? 'asc'
    : 'asc',
})
