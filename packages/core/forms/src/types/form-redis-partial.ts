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
    cluster_nodes: Array<Identifiable<ClusterNode>>
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
    sentinel_nodes: Array<Identifiable<SentinelNode>>
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

export interface FlattendRedisConfigurationFields {
  name: string
  type: PartialType
  cluster_max_redirections: number
  cluster_nodes: Array<Identifiable<ClusterNode>>
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
  sentinel_nodes: Array<Identifiable<SentinelNode>>
  sentinel_password: string
  sentinel_role?: 'master' | 'slave' | 'any'
  sentinel_username: string
  server_name?: string
  ssl_verify: boolean
  ssl: boolean
  timeout?: number
  username: string
}

export interface Field {
  label: string
  model: string
  type?: string
  default?: any
  disabled?: boolean
  help?: string
  inputType?: string
  order?: number
  required?: boolean
  valueType?: string
}

export interface FormRedisFields {
  redisType: string
  pluginType: string
  fields: Field[]
}
