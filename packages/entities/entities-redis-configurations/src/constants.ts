import { RedisType } from './types'
import type { ClusterNode, RedisConfigurationFormState, SentinelNode } from './types'

export const DEFAULT_CLUSTER_NODE: Readonly<ClusterNode> = {
  ip: '127.0.0.1',
  port: 6379,
}

export const DEFAULT_SENTINEL_NODE: Readonly<SentinelNode> = {
  host: '127.0.0.1',
  port: 6379,
}

export const DEFAULT_REDIS_TYPE: RedisType = RedisType.HOST_PORT_EE

export const DEFAULT_FIELDS: Readonly<RedisConfigurationFormState['fields']['config']> = {
  port: 6379,
  host: '127.0.0.1',
  database: 0,
  username: '',
  password: '',
  ssl: false,
  ssl_verify: false,
  server_name: '',
  connect_timeout: 2000,
  send_timeout: 2000,
  read_timeout: 2000,
  sentinel_username: '',
  sentinel_password: '',
  keepalive_pool_size: 256,
  keepalive_backlog: 0,
  sentinel_master: '',
  sentinel_nodes: [],
  cluster_nodes: [],
  cluster_max_redirections: 0,
  connection_is_proxied: false,
  timeout: 2000,
  cloud_authentication: {
    aws_is_serverless: true,
  },
}
