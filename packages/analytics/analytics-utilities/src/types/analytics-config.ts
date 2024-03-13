export type AnalyticsRetention = '1d' | '30d' | '90d' | '180d' | '365d'
export type RequestsRetention = '1d' | '7d' | '14d' | '30d'

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
  analytics: boolean
}

export interface AnalyticsConfigNoAnalyticsV2 {
  analytics: null,
  requests: null
}

export interface AnalyticsConfigBasicV2 {
  analytics: {
    percentiles: false,
    retention: 86400000
  },
  requests: null
}

export interface AnalyticsConfigAdvancedV2 {
  analytics: {
    percentiles: true,
    retention: number
  },
  requests: {
    retention: number
  }
}

export type AnalyticsConfigV2 = AnalyticsConfigNoAnalyticsV2 | AnalyticsConfigBasicV2 | AnalyticsConfigAdvancedV2
