import { defineStore } from 'pinia'
import { computed, inject, ref, watch } from 'vue'
import type { AnalyticsBridge, AnalyticsConfigV2 } from '@kong-ui-public/analytics-utilities'
import {
  DEFAULT_MAX_PARALLEL_REQUESTS,
  DEFAULT_REQUEST_INTERVAL,
  DEFAULT_REQUEST_INTERVAL_CAP,
  THIRTY_DAYS_MS,
} from '../constants'

const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

export type ConfigStoreState = null | AnalyticsConfigV2

/**
 * Caches the org's analytics config, which it gets from the injected `AnalyticsBridge.configFn`.
 *
 * The store calls `configFn` only once, when the store is first created. Pinia keeps the store
 * for the life of the app, so the store never fetches again. Create the store only when the
 * bridge can serve `configFn`: if the bridge's requests need host state that is set later in
 * the app's lifecycle, wait for that state first. A failed fetch is not retried.
 */
export const useAnalyticsConfigStore = defineStore('analytics-config', () => {
  const analyticsConfig = ref<ConfigStoreState>(null)
  const configError = ref<Error | null>(null)

  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

  if (!queryBridge) {
    console.warn('Analytics components require a query bridge supplied via provide / inject.')
    console.warn("Please ensure your application has a query bridge provided under the key 'analytics-query-provider', as described in")
    console.warn('https://github.com/Kong/public-ui-components/blob/main/packages/analytics/dashboard-renderer/README.md#requirements')

    configError.value = new Error('No analytics bridge provided')
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
      configError.value = err
      analyticsConfig.value = {
        analytics: null,
        requests: null,
      }
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

  /**
   * Waits until the config request finishes.
   *
   * Resolves when the request succeeds and also when it fails. After a failure, `configError`
   * holds the error and the getters return their defaults, for example `false` for `analytics`
   * and `percentiles`. Check `configError` when a failed request must not read as "no analytics".
   *
   * @returns {Promise<void>} A promise that resolves when `loading` is `false`.
   */
  const isReady = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!loading.value) {
        return resolve()
      }

      const unwatch = watch(loading, () => {
        if (!loading.value) {
          unwatch() // we only need this watcher once
          resolve()
        }
      })
    })
  }

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
    isReady,
    configError,
  }
})
