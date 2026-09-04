import type { TableDataGridConfig, TableDataGridHeader, TableDataGridRow, TableDataGridSort } from '../types'
import type { Ref } from 'vue'
import { computed, readonly, ref, watch } from 'vue'
import { resolveTableConfig, tableConfigsEqual } from '../utils/tableConfig'

/**
 * Owns `TableDataGrid`'s current `tableConfig` state, controlled or
 * uncontrolled, with `patchTableConfig` as the single write path for
 * grid-driven changes.
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
  // Prop resolved against headers/pageSize. Undefined, and untracked, when uncontrolled.
  const resolvedPropConfig = computed<TableDataGridConfig | undefined>(() => (
    tableConfigProp.value
      ? resolveTableConfig({ config: tableConfigProp.value, headers: headers.value, pageSize: pageSize.value })
      : undefined
  ))

  // Single source of truth. Written only by the watcher below or by patchTableConfig.
  const activeTableConfig = ref<TableDataGridConfig>(
    resolvedPropConfig.value ?? resolveTableConfig({ config: undefined, headers: headers.value, pageSize: pageSize.value }),
  )

  // Host-driven sync: a real prop change updates state and notifies the caller to push it into AG Grid.
  watch(resolvedPropConfig, (resolved) => {
    if (resolved && !tableConfigsEqual(resolved, activeTableConfig.value)) {
      activeTableConfig.value = resolved
      onExternalConfigChange?.(resolved)
    }
  })

  // Merges a patch into the current config and emits it, only on a real change.
  const patchTableConfig = (patch: Partial<TableDataGridConfig>) => {
    const next = resolveTableConfig({
      config: { ...activeTableConfig.value, ...patch },
      headers: headers.value,
      pageSize: pageSize.value,
    })

    if (tableConfigsEqual(next, activeTableConfig.value)) {
      return
    }

    activeTableConfig.value = next
    emitTableConfigUpdate(next)
  }

  // Sort-only view of activeTableConfig.
  const activeSort = computed<TableDataGridSort>(() => ({
    sortColumnKey: activeTableConfig.value.sortColumnKey,
    sortColumnOrder: activeTableConfig.value.sortColumnOrder,
  }))

  // The host's tableConfig.pageSize wins when present, else the live component default.
  const activePageSize = computed<number>(() => tableConfigProp.value?.pageSize ?? pageSize.value)

  return {
    activeTableConfig: readonly(activeTableConfig),
    activeSort,
    activePageSize,
    patchTableConfig,
  }
}
