import type { KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface KonnectRedisConfigurationFormConfig extends KonnectBaseFormConfig { }

export enum Mode {
  HOST_PORT_OPEN_SOURCE = 'host_port_open_source',
  HOST_PORT_ENTERPRISE = 'host_port_enterprise',
  SENTINEL = 'sentinel',
  CLUSTER = 'cluster',
}

export interface SentinelNode {
  host: string
  port: number
}

export interface ClusterNode {
  ip: string
  port: number
}

export interface RedisConfigurationFields {
  name: string
  mode: Mode
  port: number
  host: string
  database: number
  username: string
  password: string
  ssl: boolean
  ssl_verify: boolean
  server_name: string
  timeout: number

  connect_timeout: number
  send_timeout: number
  read_timeout: number
  sentinel_username: string
  sentinel_password: string
  keepalive_pool_size: number
  keepalive_backlog: number
  sentinel_master: string
  sentinel_role?: 'master' | 'slave' | 'any'
  sentinel_nodes: SentinelNode[]
  cluster_nodes: ClusterNode[]
  cluster_max_redirections: number
  connection_is_proxied: boolean
}

export interface RedisConfigurationFormState {
  fields: RedisConfigurationFields
  readonly: boolean
  errorMessage: string
}
