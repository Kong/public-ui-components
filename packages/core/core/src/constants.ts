import type { UserTablePreferences } from './useTablePreferences/types'

/** The localStorage key to store user table preferences */
export const USER_TABLE_PREFERENCES_LOCAL_STORAGE_KEY = 'khcp-user-table-preferences'

export const DEFAULT_USER_TABLE_PREFERENCES: UserTablePreferences = {
  pageSize: 30,
  sortColumnKey: undefined,
  sortColumnOrder: undefined,
}
