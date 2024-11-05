import type { BasicExploreQuery, ExploreQuery, AiExploreQuery, ExploreResultV4 } from './explore'
import type { AnalyticsConfigV2 } from './analytics-config'

export interface BasicDatasourceQuery {
  datasource: 'basic'
  query: BasicExploreQuery
}

export interface AdvancedDatasourceQuery {
  datasource: 'advanced'
  query: ExploreQuery
}

export interface AiDatasourceQuery {
  datasource: 'ai'
  query: AiExploreQuery
}

export type DatasourceAwareQuery = BasicDatasourceQuery | AdvancedDatasourceQuery | AiDatasourceQuery

export interface AnalyticsBridge {
  // Issue queries to the KAnalytics API
  queryFn: (query: DatasourceAwareQuery, abortController: AbortController) => Promise<ExploreResultV4>,

  // Determine the current org's analytics config
  configFn: () => Promise<AnalyticsConfigV2>,

  // Evaluate feature flags (if applicable)
  // TODO: Use `NoInfer` once we upgrade to TS 5.4:
  //  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html#the-noinfer-utility-type
  //  See note in DashboardRenderer tests.
  evaluateFeatureFlagFn: <T = boolean>(key: string, defaultValue: T) => T,
  exploreBaseUrl?: string,
}
