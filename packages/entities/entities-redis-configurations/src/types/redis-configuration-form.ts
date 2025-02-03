
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { ClusterNode, Identifiable, PartialType, SentinelNode } from './redis-configuration'

export interface KonnectRedisConfigurationFormConfig extends KonnectBaseFormConfig { }
export interface KongManagerRedisConfigurationFormConfig extends KongManagerBaseFormConfig { }


export interface RedisConfigurationFields {
  name: string
  type: PartialType
  config: {
    cluster_max_redirections: number
    cluster_nodes: Identifiable<ClusterNode>[]
    connect_timeout: number
    connection_is_proxied: boolean
    database: number
    host: string
    keepalive_backlog: number
    keepalive_pool_size: number
    password: string
    port: number
    read_timeout: number
    send_timeout: number
    sentinel_master: string
    sentinel_nodes: Identifiable<SentinelNode>[]
    sentinel_password: string
    sentinel_role?: 'master' | 'slave' | 'any'
    sentinel_username: string
    server_name?: string
    ssl_verify: boolean
    ssl: boolean
    timeout?: number // todo: not sure
    username: string
  }
}

export interface RedisConfigurationFormState {
  fields: RedisConfigurationFields
  readonly: boolean
  errorMessage: string
}
