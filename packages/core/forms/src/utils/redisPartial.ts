import type { RedisConfigurationFields } from '../types/form-redis-partial'
import { PartialType } from '../types/form-redis-partial'

export enum RedisTypeDisplay {
  HOST_PORT_CE = 'Host/Port',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  HOST_PORT_EE = 'Host/Port',
  SENTINEL = 'Sentinel',
  CLUSTER = 'Cluster',
}

export const getRedisType = (fields: RedisConfigurationFields): RedisTypeDisplay => {
  if (fields.type === PartialType.REDIS_CE) {
    return RedisTypeDisplay.HOST_PORT_CE
  }

  if (fields.config.sentinel_nodes?.length) {
    return RedisTypeDisplay.SENTINEL
  }

  if (fields.config.cluster_nodes?.length) {
    return RedisTypeDisplay.CLUSTER
  }

  return RedisTypeDisplay.HOST_PORT_EE
}

export const partialTypeDisplay = {
  [PartialType.REDIS_CE]: 'open source',
  [PartialType.REDIS_EE]: 'enterprise',
}

export const getPartialTypeDisplay = (type: PartialType): string => {
  return partialTypeDisplay[type] ?? ''
}
