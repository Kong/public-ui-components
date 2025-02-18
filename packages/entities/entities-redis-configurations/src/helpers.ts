import { v4 as uuidv4 } from 'uuid'

import { DEFAULT_CLUSTER_NODE, DEFAULT_SENTINEL_NODE } from './constants'
import { PartialType, type ClusterNode, type Identifiable, type RedisConfigurationDTO, type RedisConfigurationFields, type SentinelNode } from './types'
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

export const getRedisType = (fields: RedisConfigurationFields | RedisConfigurationDTO): RedisType => {
  if (fields.type === PartialType.REDIS_CE) {
    return RedisType.HOST_PORT_CE
  }

  if (fields.config.sentinel_nodes?.length) {
    return RedisType.SENTINEL
  }

  if (fields.config.cluster_nodes?.length) {
    return RedisType.CLUSTER
  }

  return RedisType.HOST_PORT_EE
}

export const mapRedisTypeToPartialType = (type: RedisType): PartialType => {
  return type === RedisType.HOST_PORT_CE ? PartialType.REDIS_CE : PartialType.REDIS_EE
}

export const standardize = {
  int<T>(value: string | number | undefined | null, defaultValue?: T): number | T {
    if (value === undefined || value === null) {
      return defaultValue as T
    }
    return parseInt(value.toString(), 10)
  },

  str<T>(value: string | number | undefined | null, defaultValue?: T): string | T {
    if (value === undefined || value === null || value === '') {
      return defaultValue as T
    }
    return value.toString()
  },

  clusterNodes(nodes: Identifiable<ClusterNode>[]): ClusterNode[] {
    return nodes.map(node => ({
      ...shallowCopyWithoutId(node),
      port: standardize.int(node.port)!,
    }))
  },

  sentinelNodes(nodes: Identifiable<SentinelNode>[]): SentinelNode[] {
    return nodes.map(node => ({
      ...shallowCopyWithoutId(node),
      port: standardize.int(node.port)!,
    }))
  },
}
