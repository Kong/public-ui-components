export type AnalyticsRetention = '1d' | '30d' | '90d' | '180d' | '365d'
export type RequestsRetention = '24h' | '7d' | '14d' | '30d'

export interface AnalyticsConfigEnabled {
  analytics: true
  percentiles: boolean
  api_analytics_retention_ms: number
  api_analytics_retention: AnalyticsRetention
  api_requests_retention_ms: number
  api_requests_retention: RequestsRetention
}

export interface AnalyticsConfigNoAnalytics {
  analytics: false
}

export type AnalyticsConfig = AnalyticsConfigNoAnalytics | AnalyticsConfigEnabled

export interface ControlPlaneConfig {
  id: string
  analytics: boolean
}
