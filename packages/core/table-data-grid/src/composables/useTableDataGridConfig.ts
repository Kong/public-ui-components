import type { TableDataGridConfig } from '../types'
import type { TableDataGridConfigSources } from '../types/internal'
import type { GridApi } from 'ag-grid-community'
import { computed, ref, watch } from 'vue'
import {
  buildColumnStateFromConfig,
  createResolvedTableConfig,
  getConfigFromGrid,
  getColumnVisibility,
  normalizedTableConfigsEqual,
  normalizeTableConfig,
} from '../utils/tableConfig'

/**
 * Owns the tableConfig source of truth for the wrapper.
 *
 * `tableConfig` is the optional host-controlled input. `activeTableConfig` is
 * the wrapper's current raw config, and `resolvedTableConfig` is the normalized
 * config that downstream AG Grid code should use.
 */
export const useTableDataGridConfig = <Row extends Record<string, any>>({
  emitTableConfigUpdate,
  headers,
  pageSize,
  tableConfig,
}: TableDataGridConfigSources<Row>) => {
  const activeTableConfig = ref<TableDataGridConfig>(normalizeTableConfig(tableConfig.value))
  const resolvedHeaders = computed(() => headers.value)
  const resolvedDefaultPageSize = computed(() => pageSize.value)

  const activePageSize = computed(() => activeTableConfig.value.pageSize ?? resolvedDefaultPageSize.value)
  const resolvedTableConfig = computed<TableDataGridConfig>(() => createResolvedTableConfig({
    config: activeTableConfig.value,
    headers: resolvedHeaders.value,
    pageSize: resolvedDefaultPageSize.value,
  }))
  const resolvedColumnVisibility = computed(() => getColumnVisibility(resolvedTableConfig.value))
  const resolvedSort = computed(() => ({
    sortColumnKey: resolvedTableConfig.value.sortColumnKey,
    sortColumnOrder: resolvedTableConfig.value.sortColumnOrder,
  }))

  const updateTableConfig = (nextConfig: Partial<TableDataGridConfig>) => {
    const normalized = normalizeTableConfig(nextConfig)
    if (normalizedTableConfigsEqual(activeTableConfig.value, normalized)) {
      return
    }

    activeTableConfig.value = normalized
    emitTableConfigUpdate(normalized)
  }

  const patchTableConfig = (partial: Partial<TableDataGridConfig>) => {
    const resolvedColumns = resolvedTableConfig.value.columns ?? {}
    const partialColumns = partial.columns ?? {}

    updateTableConfig({
      ...resolvedTableConfig.value,
      ...partial,
      columns: Object.fromEntries(
        Array.from(new Set([
          ...Object.keys(resolvedColumns),
          ...Object.keys(partialColumns),
        ])).map(key => [
          key,
          {
            ...resolvedColumns[key],
            ...partialColumns[key],
          },
        ]),
      ),
    })
  }

  const getGridConfig = (api: GridApi<Row>) => getConfigFromGrid({
    api,
    headers: resolvedHeaders.value,
    pageSize: activePageSize.value,
  })

  const captureGridConfig = (api: GridApi<Row>) => {
    activeTableConfig.value = getGridConfig(api)
  }

  const applyTableConfig = (api?: GridApi<Row>) => {
    if (!api) {
      return
    }

    api.applyColumnState({
      state: buildColumnStateFromConfig({
        config: resolvedTableConfig.value,
        headers: resolvedHeaders.value,
        isColumnOrderResolved: true,
      }),
      applyOrder: true,
    })
  }

  watch(tableConfig, (nextConfig) => {
    const normalized = normalizeTableConfig(nextConfig)
    if (!normalizedTableConfigsEqual(activeTableConfig.value, normalized)) {
      activeTableConfig.value = normalized
    }
  })

  return {
    activePageSize,
    applyTableConfig,
    getGridConfig,
    resolvedColumnVisibility,
    resolvedSort,
    resolvedTableConfig,
    captureGridConfig,
    patchTableConfig,
    updateTableConfig,
  }
}
