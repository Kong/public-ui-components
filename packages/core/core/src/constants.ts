import type { TablePreferences } from '@kong/kongponents'

/** The localStorage key to store user table preferences */
export const USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY = 'khcp-user-table-preferences'

export const DEFAULT_USER_TABLE_PREFERENCES: TablePreferences = {
  pageSize: 30,
  sortColumnKey: undefined,
  sortColumnOrder: undefined,
  columnWidths: {},
  columnVisibility: {},
}
