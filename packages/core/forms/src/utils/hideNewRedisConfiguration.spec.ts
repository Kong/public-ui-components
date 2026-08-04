import { describe, expect, it } from 'vitest'

import { shouldHideNewRedis } from './hideNewRedisConfiguration'

describe('shouldHideNewRedis', () => {
  it('is true for Konnect when managed-redis FF is enabled on Cloud Gateway', () => {
    expect(shouldHideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: true,
    })).toBe(true)
  })

  it('is false for Konnect when managed-redis FF is enabled on non-cloud gateway', () => {
    expect(shouldHideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: false,
    })).toBe(false)
  })

  it('is false for Konnect when managed-redis FF is disabled', () => {
    expect(shouldHideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: false,
      isCloudGateway: true,
    })).toBe(false)
  })

  it('is false for Kong Manager', () => {
    expect(shouldHideNewRedis({
      app: 'kongManager',
      apiBaseUrl: '/kong-manager',
      workspace: 'default',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: true,
    })).toBe(false)
  })
})
