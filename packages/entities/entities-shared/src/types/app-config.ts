import type { AxiosRequestConfig } from 'axios'

/** Shared config properties for all app entities */
interface BaseAppConfig {
  /** Base URL for API requests */
  apiBaseUrl: string
  /** App name. One of 'konnect' | 'kongManager' */
  app: 'konnect' | 'kongManager'
  /** An optional configuration object for the underlying Axios request */
  axiosRequestConfig?: AxiosRequestConfig
}

/** Base config properties for Konnect. All entity configs should extend this interface for the app. */
export interface KonnectConfig extends BaseAppConfig {
  /** App name. 'konnect' */
  app: 'konnect'
  /** The control plane id */
  controlPlaneId: string
  /** Optional workspace name or identifier */
  workspace?: string
  /** Identifies whether the Control Plane type is a Control Plane Group or not */
  isControlPlaneGroup?: boolean
  /** Identifies whether the control plane is a member of a control plane group (not the group itself) */
  isControlPlaneGroupMember?: boolean
  /** Should use exact match */
  isExactMatch?: boolean
  /** The control plane name */
  controlPlaneName?: string
  /** Geo server API URL, e.g. https://us.api.konghq.tech */
  geoApiServerUrl?: string
}

/** Base config properties for Kong Manager. All entity configs should extend this interface for the app. */
export interface KongManagerConfig extends BaseAppConfig {
  /** App name. 'kongManager' */
  app: 'kongManager'
  /** Workspace name */
  workspace: string
  /** Gateway instance info, used in Canopy to check if a feature is supported */
  gatewayInfo?: {
    edition: 'enterprise' | 'community'
    version: string
  }
}
