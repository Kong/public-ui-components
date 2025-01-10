import type { KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'

export interface KonnectRedisConfigurationFormConfig extends KonnectBaseFormConfig { }

export enum RedisType {
  HOST_PORT_CE,
  HOST_PORT_EE,
  SENTINEL,
  CLUSTER,
}

export interface SentinelNode {
  host: string
  port: number
}

export type Identifiable<T> = T & { id: string }

export interface ClusterNode {
  ip: string
  port: number
}

export type PartialType = 'redis-ce' | 'redis-ee'

export interface RedisConfigurationFields {
  name: string
  type: PartialType
  config: {
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
    sentinel_nodes: Identifiable<SentinelNode>[]
    cluster_nodes: Identifiable<ClusterNode>[]
    cluster_max_redirections: number
    connection_is_proxied: boolean
  }
}

export interface RedisConfigurationFormState {
  fields: RedisConfigurationFields
  readonly: boolean
  errorMessage: string
}
