import type { Plugin } from 'vue'
import type { ProviderOptions } from './types'
import type {
  ExploreResultV4,
  AnalyticsBridge,
  AnalyticsConfigV2,
  AnalyticsRetentionMs,
} from '@kong-ui-public/analytics-utilities'

// Don't import the constant: goal is to reduce bundle size.
const INJECT_QUERY_PROVIDER = 'analytics-query-provider'

const portalAnalyticsBridge: Plugin<ProviderOptions> = {
  install(app, options) {
    const { apiClient } = options

    // We don't yet have a new query endpoint for Portal.
    const queryFn = async (): Promise<ExploreResultV4> => {
      return Promise.reject(new Error('queryFn is not yet connected'))
    }

    const configFn = async (): Promise<AnalyticsConfigV2> => {
      const result = await apiClient.getApplicationAnalyticsConfig()

      if (result.data) {
        const { data } = result
        return {
          analytics: data.analytics
            ? {
              percentiles: data.analytics.percentiles,
              retention_ms: data.analytics.retention_ms as AnalyticsRetentionMs,
            }
            : null,
          requests: null,
        }
      }

      throw new Error('Failed to retrieve analytics configuration')
    }

    // We don't currently use feature flags in Portal.
    const evaluateFeatureFlagFn: AnalyticsBridge['evaluateFeatureFlagFn'] = (_key, defaultValue) => defaultValue

    const analyticsBridge: AnalyticsBridge = {
      queryFn,
      configFn,
      evaluateFeatureFlagFn,
    }

    app.provide(INJECT_QUERY_PROVIDER, analyticsBridge)
  },
}

export default portalAnalyticsBridge
