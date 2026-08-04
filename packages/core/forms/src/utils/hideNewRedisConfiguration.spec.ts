import { describe, expect, it } from 'vitest'

import { shouldHideNewRedisConfiguration } from './hideNewRedisConfiguration'

describe('shouldHideNewRedisConfiguration', () => {
  it('is true for Konnect when managed-redis FF is enabled on Cloud Gateway', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: true,
    })).toBe(true)
  })

  it('is false for Konnect when managed-redis FF is enabled on non-cloud gateway', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: false,
    })).toBe(false)
  })

  it('is false for Konnect when managed-redis FF is disabled', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: false,
      isCloudGateway: true,
    })).toBe(false)
  })

  it('is false for Kong Manager', () => {
    expect(shouldHideNewRedisConfiguration({
      app: 'kongManager',
      apiBaseUrl: '/kong-manager',
      workspace: 'default',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: true,
    })).toBe(false)
  })
})
