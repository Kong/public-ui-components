
import type { FlattendRedisConfigurationFields, RedisConfig, RedisPartialType, RedisTypeDisplay } from './types'
import type { Field } from '../shared/types'
import type { UnionFieldSchema } from 'src/types/plugins/form-schema'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)

export function toSelectItems<T extends string | number>(
  items: T[],
): Array<{ value: T, label: `${T}` }> {
  return items.map((item) => ({ value: item, label: `${item}` }))
}

export const arraySymbol = '*'
export const rootSymbol = '$'
export const separator = '.'

export function resolve(...args: string[]): string {
  return args.join(separator)
}

export function resolveRoot(...args: string[]): string {
  return resolve(rootSymbol, ...args)
}

export function isAbsolute(p: string): boolean {
  return p.startsWith(resolve(rootSymbol, ''))
}

export function toArray(p: string): string[] {
  return p.split(separator).filter(n => n !== '')
}

export function getName(p: string): string {
  const arr = toArray(p)
  return arr[arr.length - 1]
}


export const getRedisType = (
  fields: RedisConfig,
): RedisTypeDisplay => {
  if (fields.type === 'redis-ce') {
    return t('redis.shared_configuration.type_label.host_port') as RedisTypeDisplay
  }

  if (fields.config.sentinel_nodes?.length) {
    return t('redis.shared_configuration.type_label.sentinel') as RedisTypeDisplay
  }

  if (fields.config.cluster_nodes?.length) {
    return t('redis.shared_configuration.type_label.cluster') as RedisTypeDisplay
  }

  return t('redis.shared_configuration.type_label.host_port') as RedisTypeDisplay
}

export const partialTypeDisplay = {
  'redis-ce': t('redis.shared_configuration.open_source'),
  'redis-ee': t('redis.shared_configuration.enterprise'),
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

export function isTagField(schema: MaybeRefOrGetter<UnionFieldSchema | undefined>): boolean {
  const schemaVal = toValue(schema)
  if (!schemaVal) return false
  return schemaVal.type === 'set'
    && schemaVal.elements.type === 'string'
    && !schemaVal.elements.one_of
}
