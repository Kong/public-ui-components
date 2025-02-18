export enum RedisType {
  HOST_PORT_CE,
  HOST_PORT_EE,
  SENTINEL,
  CLUSTER,
}

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

export type RedisConfigurationDTO = {
  name: string
  type: PartialType
  config: RedisConfigurationConfigDTO
}

export type RedisConfigurationConfigDTO = {
  cluster_max_redirections: number | null
  cluster_nodes: ClusterNode[] | null
  connect_timeout: number | null
  connection_is_proxied: boolean | null
  database: number | null
  host: string | null
  keepalive_backlog: number | null
  keepalive_pool_size: number | null
  password: string | null
  port: number | null
  timeout: number | null // todo: not sure
  read_timeout: number | null
  send_timeout: number | null
  sentinel_master: string | null
  sentinel_nodes: SentinelNode[] | null
  sentinel_password: string | null
  sentinel_role: string | null
  sentinel_username: string | null
  server_name: string | null
  ssl_verify: boolean | null
  ssl: boolean | null
  username: string | null
}
// todo: separate this by redis type?

export type RedisConfigurationResponse = RedisConfigurationDTO & {
  created_at: string
  id: string
  updated_at: string
}

export type Identifiable<T> = T & { id: string }
