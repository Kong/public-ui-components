import { v4 as uuidv4 } from 'uuid'

import { DEFAULT_CLUSTER_NODE, DEFAULT_SENTINEL_NODE } from './constants'
import type { Identifiable } from './types'

export const shallowCopyWithId = <T extends Record<any, any>>(node: T): Identifiable<T> => {
  return { ...node, id: uuidv4() }
}

export const shallowCopyWithoutId = <T extends { id: string }>(node: T): Omit<T, 'id'> => {
  const { id, ...rest } = node
  return rest
}

export const genDefaultSentinelNode = () => shallowCopyWithId(DEFAULT_SENTINEL_NODE)

export const genDefaultClusterNode = () => shallowCopyWithId(DEFAULT_CLUSTER_NODE)
