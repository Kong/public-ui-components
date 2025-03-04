import { defineStore } from 'pinia'
import { computed, inject, ref } from 'vue'
import type { AnalyticsBridge, AnalyticsConfigV2 } from '@kong-ui-public/analytics-utilities'
import {
  DEFAULT_MAX_PARALLEL_REQUESTS,
  DEFAULT_REQUEST_INTERVAL,
  DEFAULT_REQUEST_INTERVAL_CAP,
  THIRTY_DAYS_MS,
} from '../constants'

const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

export type ConfigStoreState = null | AnalyticsConfigV2

export const useAnalyticsConfigStore = defineStore('analytics-config', () => {
  const analyticsConfig = ref<ConfigStoreState>(null)

  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

  if (!queryBridge) {
    console.warn('Analytics components require a query bridge supplied via provide / inject.')
    console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
    console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/README.md#requirements')

    // Return a mock instance in order to prevent downstream components from waiting forever on the query.
    // This allows, e.g., metric cards to show an error rather than just endlessly "loading".
    analyticsConfig.value = {
      analytics: null,
      requests: null,
    }
  } else {
    queryBridge.configFn().then(res => {
      analyticsConfig.value = res
    }).catch(err => {
      console.warn('Error fetching analytics config')
      console.warn(err)
    })
  }

  const longRetention = computed<boolean>(() => {
    const retentionMs = analyticsConfig.value?.analytics?.retention_ms
    return !!retentionMs && retentionMs >= THIRTY_DAYS_MS
  })

  const defaultQueryTimeForOrg = computed<'7d'>(() => {
    return '7d'
  })

  const loading = computed<boolean>(() => !analyticsConfig.value)
  const analytics = computed<boolean>(() => !!analyticsConfig.value?.analytics)
  const percentiles = computed<boolean>(() => !!analyticsConfig.value?.analytics?.percentiles)

  const maxParallelRequests = computed<number>(() =>
    analyticsConfig.value?.ui?.maxParallelRequests ?? DEFAULT_MAX_PARALLEL_REQUESTS,
  )

  const requestInterval = computed<number>(() =>
    analyticsConfig.value?.ui?.requestInterval ?? DEFAULT_REQUEST_INTERVAL,
  )

  const requestIntervalCap = computed<number>(() =>
    analyticsConfig.value?.ui?.requestIntervalCap ?? DEFAULT_REQUEST_INTERVAL_CAP,
  )

  return {
    analyticsConfig,
    longRetention,
    defaultQueryTimeForOrg,
    loading,
    analytics,
    percentiles,
    maxParallelRequests,
    requestInterval,
    requestIntervalCap,
  }
})
