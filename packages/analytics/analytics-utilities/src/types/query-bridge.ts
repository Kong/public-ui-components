import type { BasicExploreQuery, ExploreQuery, AiExploreQuery, ExploreResultV4 } from './explore'
import type { AnalyticsConfigV2 } from './analytics-config'
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

export type DatasourceAwareQuery = BasicDatasourceQuery | AdvancedDatasourceQuery | AiDatasourceQuery

// All flags in this interface should be optional; defaults are as documented.
export interface StaticConfig {
  increaseCsvExportLimit?: boolean // default: true
}

export interface AnalyticsBridge {
  // Issue queries to the KAnalytics API
  queryFn: (query: DatasourceAwareQuery, abortController: AbortController) => Promise<ExploreResultV4>

  // Determine the current org's analytics config
  configFn: () => Promise<AnalyticsConfigV2>

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
