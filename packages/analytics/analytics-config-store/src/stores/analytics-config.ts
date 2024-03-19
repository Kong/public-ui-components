import { defineStore } from 'pinia'
import type { Ref } from 'vue'
import { inject, ref } from 'vue'
import type { AnalyticsBridge, AnalyticsConfigV2 } from '@kong-ui-public/analytics-utilities'

const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

export type ConfigStoreState = null | AnalyticsConfigV2

export const useAnalyticsConfigStore = defineStore('analytics-config', () => {
  let fetchedConfig = false
  const configResult = ref<ConfigStoreState>(null)

  const getConfig = (): Ref<ConfigStoreState> => {
    const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

    if (!queryBridge) {
      console.warn('Analytics components require a query bridge supplied via provide / inject.')
      console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
      console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/README.md#requirements')

      // Return a mock instance in order to prevent downstream components from waiting forever on the query.
      // This allows, e.g., metric cards to show an error rather than just endlessly "loading".
      configResult.value = {
        analytics: null,
        requests: null,
      }

      return configResult
    }

    if (!fetchedConfig) {
      // We haven't tried to fetch the config yet.
      fetchedConfig = true

      queryBridge.configFn().then(res => {
        configResult.value = res
      }).catch(err => {
        console.warn('Error fetching analytics config')
        console.warn(err)
      })
    }

    return configResult
  }

  return {
    getConfig,
  }
})
