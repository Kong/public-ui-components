import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { BaseTableHeaders } from '../types/entity-base-table'
import { getManagedByFieldLabel } from '../utils/managed-by'
import useManagedByEnabled from './useManagedByEnabled'

/**
 * The `managed_by` column wiring shared by every entity list.
 *
 * While the flag is off the column is absent entirely, so it never shows up in the column
 * visibility menu either. Once the flag is on it is still opt-in: hidden until a user
 * turns it on from the column visibility menu, via the returned `defaultTablePreferences`.
 *
 * @param baseHeaders The list's own headers, always offered to the table.
 * @param extraColumnVisibility Additional per-column visibility defaults for tables that
 * already hide other columns by default (e.g. `created_at`).
 */
export default function useManagedByColumn(
  baseHeaders: MaybeRefOrGetter<BaseTableHeaders>,
  extraColumnVisibility: Record<string, boolean> = {},
): {
  defaultTablePreferences: { columnVisibility: Record<string, boolean> }
  tableHeaders: ComputedRef<BaseTableHeaders>
} {
  const isManagedByEnabled = useManagedByEnabled()

  return {
    defaultTablePreferences: {
      columnVisibility: {
        managed_by: false,
        ...extraColumnVisibility,
      },
    },
    tableHeaders: computed<BaseTableHeaders>(() => ({
      ...toValue(baseHeaders),
      ...(isManagedByEnabled.value ? { managed_by: { label: getManagedByFieldLabel(), sortable: false } } : {}),
    })),
  }
}
