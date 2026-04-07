import { describe, expect, it } from 'vitest'

import { inferRedisPartialManagedSource } from './helpers'
import { REDIS_CONFIGURATION_SOURCE } from './types'

describe('Infer Partial Source', () => {
  it('treats empty tags as self-managed', () => {
    expect(inferRedisPartialManagedSource({})).toBe(REDIS_CONFIGURATION_SOURCE.SELF_MANAGED)
    expect(inferRedisPartialManagedSource({ tags: [] })).toBe(REDIS_CONFIGURATION_SOURCE.SELF_MANAGED)
  })

  it('detects Konnect-managed from konnect-managed tag', () => {
    expect(inferRedisPartialManagedSource({ tags: ['konnect-managed'] })).toBe(
      REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED,
    )
    expect(inferRedisPartialManagedSource({ tags: ['KONNECT-MANAGED'] })).toBe(
      REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED,
    )
  })

  it('detects Konnect-managed from managed_cache.v0 tag', () => {
    expect(inferRedisPartialManagedSource({ tags: ['managed_cache.v0'] })).toBe(
      REDIS_CONFIGURATION_SOURCE.KONNECT_MANAGED,
    )
  })

  it('stays self-managed for unrelated tags', () => {
    expect(inferRedisPartialManagedSource({ tags: ['production', 'eu'] })).toBe(
      REDIS_CONFIGURATION_SOURCE.SELF_MANAGED,
    )
  })
})
