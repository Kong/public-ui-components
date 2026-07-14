import { describe, expect, it } from 'vitest'

import { shouldHideNewRedisConfiguration } from './hideNewRedisConfiguration'

describe('shouldHideNewRedisConfiguration', () => {
  it('is true for Konnect when managed-redis FF is enabled', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
    })).toBe(true)
  })

  it('is false for Konnect when managed-redis FF is disabled', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: false,
    })).toBe(false)
  })

  it('is false for Kong Manager', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'kongManager',
      apiBaseUrl: '/kong-manager',
      workspace: 'default',
      isKonnectManagedRedisEnabled: true,
    })).toBe(false)
  })
})
