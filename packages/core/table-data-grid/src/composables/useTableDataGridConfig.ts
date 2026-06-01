import type {
  TableDataGridConfig,
  TableDataGridHeader,
} from '../types'
import type { GridApi } from 'ag-grid-community'
import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'
import {
  buildColumnStateFromConfig,
  createResolvedTableConfig,
  getConfigFromGrid,
  normalizedTableConfigsEqual,
  normalizeTableConfig,
} from '../utils/tableConfig'

export const useTableDataGridConfig = <Row extends Record<string, any>>({
  tableConfig,
  emitTableConfigUpdate,
  headers,
  pageSize,
}: {
  tableConfig: Readonly<Ref<TableDataGridConfig | undefined>>
  emitTableConfigUpdate: (config: TableDataGridConfig) => void
  headers: Readonly<Ref<Array<TableDataGridHeader<Row>>>>
  pageSize: Readonly<Ref<number>>
}) => {
  const activeTableConfig = ref<TableDataGridConfig>(normalizeTableConfig(tableConfig.value))
  const resolvedHeaders = computed(() => headers.value)
  const resolvedDefaultPageSize = computed(() => pageSize.value)

  const activePageSize = computed(() => activeTableConfig.value.pageSize ?? resolvedDefaultPageSize.value)
  const resolvedTableConfig = computed<TableDataGridConfig>(() => createResolvedTableConfig({
    config: activeTableConfig.value,
    headers: resolvedHeaders.value,
    pageSize: resolvedDefaultPageSize.value,
  }))
  const resolvedColumnVisibility = computed(() => resolvedTableConfig.value.columnVisibility ?? {})
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
    updateTableConfig({
      ...resolvedTableConfig.value,
      ...partial,
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
