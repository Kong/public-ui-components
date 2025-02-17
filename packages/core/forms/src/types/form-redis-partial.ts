type Identifiable<T> = T & { id: string }

export enum PartialType {
  REDIS_CE = 'redis-ce',
  REDIS_EE = 'redis-ee',
}

export type SentinelNode = {
  host: string
  port: number
}

export type ClusterNode = {
  ip: string
  port: number
}

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
    sentinel_master?: string
    sentinel_nodes: Identifiable<SentinelNode>[]
    sentinel_password: string
    sentinel_role?: 'master' | 'slave' | 'any'
    sentinel_username: string
    server_name?: string
    ssl_verify: boolean
    ssl: boolean
    timeout?: number
    username: string
  }
}
