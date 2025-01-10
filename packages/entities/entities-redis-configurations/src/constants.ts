import { RedisType } from './types'
import type { ClusterNode, SentinelNode } from './types'

export const DEFAULT_CLUSTER_NODE: ClusterNode = {
  ip: '127.0.0.1',
  port: 6379,
}

export const DEFAULT_SENTINEL_NODE: SentinelNode = {
  host: '127.0.0.1',
  port: 6379,
}

export const DEFAULT_REDIS_TYPE = RedisType.HOST_PORT_CE
