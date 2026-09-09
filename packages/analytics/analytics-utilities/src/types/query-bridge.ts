import type {
  ApiRequestsResult,
  BasicExploreQuery,
  ExploreQuery,
  AiExploreQuery,
  ExploreResultV4,
  AgenticExploreQuery,
  ManagedCacheExploreQuery,
  PlatformExploreQuery,
  PlatformTabularQuery,
  PlatformTabularResponse,
  RequestQuery,
} from './explore'
import type { AnalyticsConfigV2 } from './analytics-config'
import type { DatasourceConfig } from './datasource-config'
import type { Component } from 'vue'

export interface BasicDatasourceQuery {
  datasource: 'basic'
  query: BasicExploreQuery
}

export interface AdvancedDatasourceQuery {
  datasource: 'api_usage'
  query: ExploreQuery
}

export interface AiDatasourceQuery {
  datasource: 'llm_usage'
  query: AiExploreQuery
}

export interface AgenticDatasourceQuery {
  datasource: 'agentic_usage'
  query: AgenticExploreQuery
}

export interface ManagedCacheDatasourceQuery {
  datasource: 'managed_cache_usage'
  query: ManagedCacheExploreQuery
}

/** @deprecated Use `PlatformUsageDatasourceQuery`. */
export interface PlatformDatasourceQuery {
  datasource: 'platform'
  query: PlatformExploreQuery
}

export interface PlatformUsageDatasourceQuery {
  datasource: 'platform_usage'
  query: PlatformExploreQuery
}

export type DatasourceAwareQuery = BasicDatasourceQuery | AdvancedDatasourceQuery | AiDatasourceQuery | AgenticDatasourceQuery | ManagedCacheDatasourceQuery | PlatformDatasourceQuery | PlatformUsageDatasourceQuery

/** @deprecated Use `PlatformUsageDatasourceTabularQuery`. */
export interface PlatformDatasourceTabularQuery {
  datasource: 'platform'
  query: PlatformTabularQuery
}

export interface PlatformUsageDatasourceTabularQuery {
  datasource: 'platform_usage'
  query: PlatformTabularQuery
}

export type DatasourceAwareTabularQuery = PlatformDatasourceTabularQuery | PlatformUsageDatasourceTabularQuery

export interface ApiRequestsDatasourceQuery {
  datasource: 'api_requests'
  query: RequestQuery
}

// All flags in this interface should be optional; defaults are as documented.
export interface StaticConfig {
  increaseCsvExportLimit?: boolean // default: true
}

export interface AnalyticsBridge {
  // Issue queries to the KAnalytics API
  queryFn: (query: DatasourceAwareQuery, abortController: AbortController) => Promise<ExploreResultV4>

  // Issue tabular queries to the platform tabular explore API
  tabularQueryFn?: (query: DatasourceAwareTabularQuery, abortController: AbortController) => Promise<PlatformTabularResponse>

  // Fetch one page of request records, callers page through `meta.cursor`
  requestsQueryFn?: (query: ApiRequestsDatasourceQuery, abortController: AbortController) => Promise<ApiRequestsResult>

  // Determine the current org's analytics config
  configFn: () => Promise<AnalyticsConfigV2>

  // Determine the current org's datasource config
  datasourceConfigFn: () => Promise<DatasourceConfig[]>

  // Evaluate feature flags (if applicable)
  evaluateFeatureFlagFn: <T = boolean>(key: string, defaultValue: T) => T

  // Static config flags that may vary by environment
  // Optional; the environment generally shouldn't have to set this config.
  staticConfig?: StaticConfig

  // Define the location of explore to enable jump-to-explore.
  // Async because there might need to be permissions checks.
  exploreBaseUrl?: () => Promise<string>

  // Define the location of requests to enable jump-to-requests.
  // Async because there might need to be permissions checks.
  requestsBaseUrl?: () => Promise<string>

  // Dynamically provide certain components that aren't available in all environments
  fetchComponent?: (name: string) => Promise<Component>
}
