import { uniqueId } from 'lodash-es'
import type { FlattendRedisConfigurationFields, RedisConfig, RedisPartialType, RedisTypeDisplay } from './types'
import type { Field } from '../shared/types'

const ID_PREFIX = '__request_callout_'

export function getCalloutId(): string {
  return uniqueId(ID_PREFIX)
}

export const getRedisType = (
  fields: RedisConfig,
): RedisTypeDisplay => {
  if (fields.type === 'redis-ce') {
    return 'Host/Port'
  }

  if (fields.config.sentinel_nodes?.length) {
    return 'Sentinel'
  }

  if (fields.config.cluster_nodes?.length) {
    return 'Cluster'
  }

  return 'Host/Port'
}

export const partialTypeDisplay = {
  'redis-ce': 'open source',
  'redis-ee': 'enterprise',
}

export const getPartialTypeDisplay = (type: RedisPartialType): string => {
  return partialTypeDisplay[type] ?? ''
}

export function useRedisNonstandardFields(
  partialFields: FlattendRedisConfigurationFields,
  redisFields: Field[],
) {
  const redisFieldPattern = /(?<=config-redis-).*/
  const redisLabelPattern = /Config\.Redis.*/
  const nonStandardConfigFields = redisFields.filter((field) => {
    const match = field.model.match(redisFieldPattern)
    return match && !Object.keys(partialFields).includes(match[0])
  })
  return nonStandardConfigFields.map((field) => {
    const labelMatch = field.label.match(redisLabelPattern)
    return {
      label: labelMatch ? labelMatch[0] : field.label,
      key: field.model,
      value: 'N/A',
      type: 'text',
    }
  })
}
