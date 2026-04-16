import { describe, expect, it } from 'vitest'

import { inferRedisPartialManagedSource, isKonnectManagedRedisEnabled } from './helpers'
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

describe('isKonnectManagedRedisEnabled', () => {
  it('is true only for Konnect with FF and for cloud gateway', () => {
    expect(
      isKonnectManagedRedisEnabled({
        app: 'konnect',
        isKonnectManagedRedisEnabled: true,
        isCloudGateway: true,
      }),
    ).toBe(true)
  })

  it('is false when any of 3 conditions not met', () => {
    expect(
      isKonnectManagedRedisEnabled({
        app: 'kongManager',
        isKonnectManagedRedisEnabled: true,
        isCloudGateway: true,
      }),
    ).toBe(false)
    expect(
      isKonnectManagedRedisEnabled({
        app: 'konnect',
        isKonnectManagedRedisEnabled: false,
        isCloudGateway: true,
      }),
    ).toBe(false)
    expect(
      isKonnectManagedRedisEnabled({
        app: 'konnect',
        isKonnectManagedRedisEnabled: true,
        isCloudGateway: false,
      }),
    ).toBe(false)
  })
})
