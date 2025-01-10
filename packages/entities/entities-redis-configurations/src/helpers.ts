import { v4 as uuidv4 } from 'uuid'

import { DEFAULT_CLUSTER_NODE, DEFAULT_SENTINEL_NODE } from './constants'
import type { Identifiable, PartialType, RedisConfigurationFields } from './types'
import { RedisType } from './types'

export const shallowCopyWithId = <T extends Record<any, any>>(node: T): Identifiable<T> => {
  return { ...node, id: uuidv4() }
}

export const shallowCopyWithoutId = <T extends { id: string }>(node: T): Omit<T, 'id'> => {
  const { id, ...rest } = node
  return rest
}

export const genDefaultSentinelNode = () => shallowCopyWithId(DEFAULT_SENTINEL_NODE)

export const genDefaultClusterNode = () => shallowCopyWithId(DEFAULT_CLUSTER_NODE)

export const getRedisType = (fields: RedisConfigurationFields): RedisType => {
  if (fields.type === 'redis-ce') {
    return RedisType.HOST_PORT_CE
  }

  if (fields.config.sentinel_nodes.length) {
    return RedisType.SENTINEL
  }

  if (fields.config.cluster_nodes.length) {
    return RedisType.CLUSTER
  }

  return RedisType.HOST_PORT_EE
}

export const mapRedisTypeToPartialType = (type: RedisType): PartialType => {
  return type === RedisType.HOST_PORT_CE ? 'redis-ce' : 'redis-ee'
}
