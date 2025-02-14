import type { RedisConfigurationFields } from '@kong-ui-public/entities-redis-configurations'
import { PartialType } from '@kong-ui-public/entities-redis-configurations'

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

export type { RedisConfigurationFields }
