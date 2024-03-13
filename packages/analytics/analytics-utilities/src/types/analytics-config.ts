export type AnalyticsRetention = '1d' | '30d' | '90d' | '180d' | '365d'
export type RequestsRetention = '1d' | '7d' | '14d' | '30d'

export type AnalyticsRetentionMs =
  | 86400000 // 1d
  | 2592000000 // 30d
  | 7776000000 // 90d
  | 15552000000 // 180d
  | 31536000000 // 365d
export type RequestsRetentionMs =
  | 86400000 // 1d
  | 604800000 // 7d
  | 1209600000 // 14d
  | 2592000000 // 30d

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
    retention_ms: 86400000
  },
  requests: null
}

export interface AnalyticsConfigAdvancedV2 {
  analytics: {
    percentiles: true,
    retention_ms: AnalyticsRetentionMs
  },
  requests: {
    retention_ms: RequestsRetentionMs
  }
}

export type AnalyticsConfigV2 = AnalyticsConfigNoAnalyticsV2 | AnalyticsConfigBasicV2 | AnalyticsConfigAdvancedV2
