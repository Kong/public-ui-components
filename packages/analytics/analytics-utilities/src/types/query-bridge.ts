import type { ExploreQuery, ExploreResultV4 } from './explore-v4'
import type { AnalyticsConfigV2 } from './analytics-config'

export interface AnalyticsBridge {
  // Issue queries to the KAnalytics API
  queryFn: (query: ExploreQuery, abortController: AbortController) => Promise<ExploreResultV4>,

  // Determine the current org's analytics config
  configFn: () => Promise<AnalyticsConfigV2>,

  // Evaluate feature flags (if applicable)
  evaluateFeatureFlagFn: <T = boolean>(key: string, defaultValue: T) => T,
}
