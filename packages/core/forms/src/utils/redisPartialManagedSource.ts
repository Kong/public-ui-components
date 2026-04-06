import type { RedisConfigurationFields } from '../types'

/**
 * Same values as `REDIS_CONFIGURATION_SOURCE`/ `RedisConfigurationSource` in
 * `@kong-ui-public/entities-redis-configurations`. Re-declared here because `forms`
 * must not depend on that package
 */
export const REDIS_CONFIGURATION_SOURCE = {
  KONNECT_MANAGED: 'konnect-managed',
  SELF_MANAGED: 'self-managed',
} as const

export type RedisConfigurationSource =
  (typeof REDIS_CONFIGURATION_SOURCE)[keyof typeof REDIS_CONFIGURATION_SOURCE]

const managedCacheTag = 'managed_cache.v0'

export function redisManagedSourceFromTags(
  partial: Pick<RedisConfigurationFields, 'tags'>,
): RedisConfigurationSource {
  const tags = Array.isArray(partial.tags) ? partial.tags : []
  const normalizedTags = tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.toLowerCase())

  return normalizedTags.includes(REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED)
    || normalizedTags.includes(managedCacheTag)
    ? REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED
    : REDIS_CONFIGURATION_SOURCE.SELF_MANAGED
}
