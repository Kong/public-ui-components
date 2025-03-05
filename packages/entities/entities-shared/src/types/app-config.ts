import type { AxiosRequestConfig } from 'axios'

export enum AppType {
  Konnect = 'konnect',
  KongManager = 'kongManager',
}

/** Shared config properties for all app entities */
interface BaseAppConfig {
  /** Base URL for API requests */
  apiBaseUrl: string
  /** App name. One of 'konnect' | 'kongManager' */
  app: AppType
  /** An optional configuration object for the underlying Axios request */
  axiosRequestConfig?: AxiosRequestConfig
}

/** Base config properties for Konnect. All entity configs should extend this interface for the app. */
export interface KonnectConfig extends BaseAppConfig {
  /** App name. 'konnect' */
  app: AppType.Konnect
  /** The control plane id */
  controlPlaneId: string
  /** Should use exact match */
  isExactMatch?: boolean
}

/** Base config properties for Kong Manager. All entity configs should extend this interface for the app. */
export interface KongManagerConfig extends BaseAppConfig {
  /** App name. 'kongManager' */
  app: AppType.KongManager
  /** Workspace name */
  workspace: string
  /** Gateway instance info, used in Canopy to check if a feature is supported */
  gatewayInfo?: {
    edition: 'enterprise' | 'community'
    version: string
  }
}
