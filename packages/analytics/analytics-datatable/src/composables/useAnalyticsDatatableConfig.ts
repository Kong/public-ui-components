import type {
  AnalyticsDatatableConfig,
  AnalyticsDatatableHeader,
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

export const useAnalyticsDatatableConfig = <Row extends Record<string, any>>({
  tableConfig,
  emitTableConfigUpdate,
  headers,
  pageSize,
  onTableConfigChange,
}: {
  tableConfig: Readonly<Ref<AnalyticsDatatableConfig | undefined>>
  emitTableConfigUpdate: (config: AnalyticsDatatableConfig) => void
  headers: Readonly<Ref<Array<AnalyticsDatatableHeader<Row>>>>
  pageSize: Readonly<Ref<number>>
  onTableConfigChange?: (nextConfig: AnalyticsDatatableConfig, previousConfig: AnalyticsDatatableConfig) => void
}) => {
  const activeTableConfig = ref<AnalyticsDatatableConfig>(normalizeTableConfig(tableConfig.value))
  const resolvedHeaders = computed(() => headers.value)
  const resolvedDefaultPageSize = computed(() => pageSize.value)

  const activePageSize = computed(() => activeTableConfig.value.pageSize ?? resolvedDefaultPageSize.value)
  const resolvedTableConfig = computed<AnalyticsDatatableConfig>(() => createResolvedTableConfig({
    config: activeTableConfig.value,
    headers: resolvedHeaders.value,
    pageSize: resolvedDefaultPageSize.value,
  }))
  const resolvedColumnVisibility = computed(() => resolvedTableConfig.value.columnVisibility ?? {})
  const resolvedSort = computed(() => resolvedTableConfig.value.sort)

  const updateTableConfig = (nextConfig: Partial<AnalyticsDatatableConfig>) => {
    const normalized = normalizeTableConfig(nextConfig)
    if (normalizedTableConfigsEqual(activeTableConfig.value, normalized)) {
      return
    }

    const previousConfig = activeTableConfig.value
    activeTableConfig.value = normalized
    emitTableConfigUpdate(normalized)
    onTableConfigChange?.(normalized, previousConfig)
  }

  const patchTableConfig = (partial: Partial<AnalyticsDatatableConfig>) => {
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
      const previousConfig = activeTableConfig.value
      activeTableConfig.value = normalized
      onTableConfigChange?.(normalized, previousConfig)
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
