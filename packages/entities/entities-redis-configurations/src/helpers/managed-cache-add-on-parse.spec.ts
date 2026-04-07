import { describe, expect, it } from 'vitest'

import { getCacheConfigId, isManagedCacheAddOn, parseManagedAddOn } from './managed-cache-add-on-parse'

describe('parseManagedAddOn', () => {
  it('returns null for non-objects or missing properties', () => {
    expect(parseManagedAddOn(null)).toBeNull()
    expect(parseManagedAddOn(undefined)).toBeNull()
    expect(parseManagedAddOn([])).toBeNull()
    expect(parseManagedAddOn({})).toBeNull()
    expect(parseManagedAddOn({ id: '', config: { kind: 'managed-cache.v0' } })).toBeNull()
    expect(parseManagedAddOn({ id: 'addon_invalid', config: {} })).toBeNull()
  })

  it('uses state_metadata under config', () => {
    expect(
      parseManagedAddOn({
        id: 'a',
        config: {
          kind: 'managed-cache.v0',
          state_metadata: { provisioning_state: 'ready' },
        },
      })?.config.state_metadata,
    ).toEqual({ provisioning_state: 'ready' })

    expect(
      parseManagedAddOn({
        id: 'b',
        state_metadata: { provisioning_state: 'not_ready' },
        config: { kind: 'managed-cache.v0' },
      })?.config.state_metadata,
    ).toBeUndefined()
  })
})

describe('getCacheConfigId', () => {
  it('reads cache_config_id from config.state_metadata', () => {
    const addOn = parseManagedAddOn({
      id: 'addon-1',
      config: {
        kind: 'managed-cache.v0',
        state_metadata: { cache_config_id: 'partial-123' },
      },
    })!
    expect(getCacheConfigId(addOn)).toBe('partial-123')
  })
})

describe('isManagedCacheAddOn', () => {
  it('only managed-cache.v0 counts', () => {
    expect(isManagedCacheAddOn({ id: '1', config: { kind: 'managed-cache.v0' } })).toBe(true)
    expect(isManagedCacheAddOn({ id: '2', config: { kind: 'other' } })).toBe(false)
    expect(isManagedCacheAddOn('random')).toBe(false)
  })
})
