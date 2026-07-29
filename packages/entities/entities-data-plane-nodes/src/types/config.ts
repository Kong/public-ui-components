import type { AxiosRequestConfig } from 'axios'

interface BaseChangeLogLevelConfig {
  apiBaseUrl: string
  axiosRequestConfig?: AxiosRequestConfig
}

export interface KonnectChangeLogLevelConfig extends BaseChangeLogLevelConfig {
  app: 'konnect'
  controlPlaneId: string
}

export interface KongManagerChangeLogLevelConfig extends BaseChangeLogLevelConfig {
  app: 'kongManager'
}

export type ChangeLogLevelConfig = KonnectChangeLogLevelConfig | KongManagerChangeLogLevelConfig
