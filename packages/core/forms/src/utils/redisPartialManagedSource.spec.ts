import { describe, expect, it } from 'vitest'

import { REDIS_CONFIGURATION_SOURCE, redisManagedSourceFromTags } from './redisPartialManagedSource'

describe('Redis Source From Tags', () => {
  it('treats missing or empty tags as self-managed', () => {
    expect(redisManagedSourceFromTags({})).toBe(REDIS_CONFIGURATION_SOURCE.SELF_MANAGED)
    expect(redisManagedSourceFromTags({ tags: [] })).toBe(REDIS_CONFIGURATION_SOURCE.SELF_MANAGED)
  })

  it('treats konnect-managed or managed_cache.v0 tags as Konnect-managed', () => {
    expect(redisManagedSourceFromTags({ tags: ['konnect-managed'] })).toBe(
      REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED,
    )
    expect(redisManagedSourceFromTags({ tags: ['managed_cache.v0'] })).toBe(
      REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED,
    )
  })
})
