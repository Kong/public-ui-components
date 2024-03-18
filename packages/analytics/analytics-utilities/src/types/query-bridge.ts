import type { ExploreQuery, ExploreResultV4 } from './explore-v4'
import type { AnalyticsConfigV2 } from './analytics-config'

export interface AnalyticsBridge {
  queryFn: (query: ExploreQuery, abortController: AbortController) => Promise<ExploreResultV4>,
  configFn: () => Promise<AnalyticsConfigV2>,
}
