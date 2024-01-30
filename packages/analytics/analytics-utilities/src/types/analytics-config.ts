export type AnalyticsRetention = '30d' | '90d' | '180d' | '365d'
export type RequestsRetention = '24h' | '7d' | '14d' | '30d'

export interface AnalyticsConfig {
  analytics: boolean,
  percentiles: boolean,
  api_analytics_retention_ms: number,
  api_analytics_retention: AnalyticsRetention,
  api_requests_retention_ms: number,
  api_requests_retention: RequestsRetention,
}
