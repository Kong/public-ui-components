import type { TableDataGridConfig, TableDataGridHeader, TableDataGridRow, TableDataGridSort } from '../types'
import type { Ref } from 'vue'
import { computed, readonly, ref, watch } from 'vue'
import { resolveTableConfig, tableConfigsEqual } from '../utils/tableConfig'

/**
 * Owns `TableDataGrid`'s current `tableConfig` state: resolves the
 * host-supplied (or absent) `tableConfig` prop against the current headers
 * and page size, mirrors it into an internal ref, and exposes a single
 * write path (`patchTableConfig`) for grid-driven changes.
 *
 * Grid-driven writes go through `patchTableConfig`, which mutates
 * `activeTableConfig` directly and never touches the prop, so they can
 * never re-trigger the prop watcher below. Host-driven writes (a changed
 * `tableConfig` prop) go through that watcher, which calls
 * `onExternalConfigChange` so the caller can push the change into AG Grid
 * imperatively, since it didn't originate from a grid interaction.
 *
 * @param headers Current column headers, used to validate the resolved sort key.
 * @param pageSize Reactive component-level page size default.
 * @param tableConfig Host-supplied `tableConfig` prop, or `undefined` when uncontrolled.
 * @param emitTableConfigUpdate Called with the resolved config whenever `patchTableConfig` changes it.
 * @param onExternalConfigChange Called when the host-supplied prop changes the resolved config.
 */
export const useTableDataGridConfig = <Row extends object = TableDataGridRow>({
  headers,
  pageSize,
  tableConfig: tableConfigProp,
  emitTableConfigUpdate,
  onExternalConfigChange,
}: {
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  pageSize: Readonly<Ref<number>>
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
  emitTableConfigUpdate: (config: TableDataGridConfig) => void
  onExternalConfigChange?: (config: TableDataGridConfig) => void
}) => {
  const resolve = (config: TableDataGridConfig | undefined) => (
    resolveTableConfig({ config, headers: headers.value, pageSize: pageSize.value })
  )

  const activeTableConfig = ref<TableDataGridConfig>(resolve(tableConfigProp.value))

  watch(() => resolve(tableConfigProp.value), (resolved) => {
    if (!tableConfigsEqual(resolved, activeTableConfig.value)) {
      activeTableConfig.value = resolved
      onExternalConfigChange?.(resolved)
    }
  })

  const patchTableConfig = (patch: Partial<TableDataGridConfig>) => {
    const next = resolve({ ...activeTableConfig.value, ...patch })

    if (tableConfigsEqual(next, activeTableConfig.value)) {
      return
    }

    activeTableConfig.value = next
    emitTableConfigUpdate(next)
  }

  const activeSort = computed<TableDataGridSort>(() => ({
    sortColumnKey: activeTableConfig.value.sortColumnKey,
    sortColumnOrder: activeTableConfig.value.sortColumnOrder,
  }))

  const activePageSize = computed<number>(() => activeTableConfig.value.pageSize ?? pageSize.value)

  return {
    activeTableConfig: readonly(activeTableConfig),
    activeSort,
    activePageSize,
    patchTableConfig,
  }
}
