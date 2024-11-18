import type { KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface KonnectRedisConfigurationFormConfig extends KonnectBaseFormConfig { }

export enum RedisType {
  HOST_PORT_OPEN_SOURCE = 'host_port_open_source',
  HOST_PORT_ENTERPRISE = 'host_port_enterprise',
  SENTINEL = 'sentinel',
  CLUSTER = 'cluster',
}

export interface RedisConfigurationFields {
  name: string
  type: RedisType
  port: number
  host: string
  database: number
  username: string
  password: string
}

export interface RedisConfigurationFormState {
  fields: RedisConfigurationFields
  readonly: boolean
  errorMessage: string
}
