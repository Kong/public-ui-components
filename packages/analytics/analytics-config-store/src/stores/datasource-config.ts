import { defineStore } from 'pinia'
import { computed, inject, ref, watch } from 'vue'
import type { AllFilters, AnalyticsBridge, DatasourceConfig, Field } from '@kong-ui-public/analytics-utilities'

const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

export type MappedDatasourceConfig = DatasourceConfig & {
  fieldsMap: Record<string, Field>
}

export const useDatasourceConfigStore = defineStore('datasource-config', () => {
  const datasourceConfig = ref<DatasourceConfig[] | undefined>(undefined)
  const datasourceConfigError = ref<Error | null>(null)

  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

  if (!queryBridge) {
    console.warn('Analytics components require a query bridge supplied via provide / inject.')
    console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
    console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/README.md#requirements')

    datasourceConfigError.value = new Error('No analytics bridge provided')
    datasourceConfig.value = []
  } else {
    queryBridge.datasourceConfigFn().then((res) => {
      datasourceConfig.value = res
    }).catch(err => {
      datasourceConfigError.value = err
      datasourceConfig.value = []
      console.warn('Error fetching datasource config')
      console.warn(err)
    })
  }

  const loading = computed<boolean>(() => datasourceConfig.value === undefined)

  const isReady = async (): Promise<void> => {
    return new Promise(resolve => {
      if (!loading.value) {
        return resolve()
      }

      const unwatch = watch(() => loading.value, (newVal) => {
        if (!newVal) {
          unwatch()
          resolve()
        }
      })
    })
  }

  const datasourceConfigMap = computed<Record<string, MappedDatasourceConfig>>(() => {
    return (datasourceConfig.value ?? []).reduce<Record<string, MappedDatasourceConfig>>((map, ds) => {
      const fieldsMap = ds.fields.reduce<Record<string, Field>>((fieldMap, field) => {
        fieldMap[field.name] = field
        return fieldMap
      }, {})

      map[ds.name] = {
        ...ds,
        fieldsMap,
      }

      return map
    }, {})
  })

  const getFieldDataSources = computed(() => {
    return (fieldName: string): string[] => {
      if (loading.value) {
        return []
      }

      return (datasourceConfig.value ?? [])
        .filter(ds => ds.fields.some(field => field.name === fieldName))
        .map(ds => ds.name)
    }
  })

  const isFilterValidForDatasource = computed(() => {
    return ({
      datasource,
      filter,
    }: {
      datasource: string
      filter: AllFilters
    }): boolean => {
      // If datasource config is not ready yet assume filter is valid.
      // Once config is loaded, it will be re-evaluated.
      if (loading.value) {
        return true
      }
      const datasourceConfigEntry = datasourceConfigMap.value[datasource]

      // If we don't find a datasource assume the filter is valid.
      // We may be dealing with a goap datasource that we don't have config for.
      if (!datasourceConfigEntry) {
        return true
      }

      const field = datasourceConfigEntry.fieldsMap[filter.field]

      if (!field?.filter) {
        return false
      }

      return field.filter.operators.flatMap(operator => operator.ops).includes(filter.operator)
    }
  })

  const stripUnknownFilters = computed(() => {
    return ({
      datasource,
      filters,
    }: {
      datasource: string
      filters: AllFilters[]
    }): AllFilters[] => {
      return filters.filter(filter => isFilterValidForDatasource.value({ datasource, filter }))
    }
  })

  return {
    datasourceConfig,
    datasourceConfigError,
    datasourceConfigMap,
    getFieldDataSources,
    isFilterValidForDatasource,
    loading,
    isReady,
    stripUnknownFilters,
  }
})
