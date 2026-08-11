import { describe, expect, it } from 'vitest'

import { hideNewRedis } from './hideNewRedisConfiguration'

describe('hideNewRedis', () => {
  it('is true for Konnect when managed-redis FF is enabled on Cloud Gateway', () => {
    expect(hideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: true,
    })).toBe(true)
  })

  it('is false for Konnect when managed-redis FF is enabled on non-Cloud Gateway', () => {
    expect(hideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: true,
      isCloudGateway: false,
    })).toBe(false)
  })

  it('is false for Konnect when managed-redis FF is disabled', () => {
    expect(hideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isKonnectManagedRedisEnabled: false,
      isCloudGateway: true,
    })).toBe(false)
  })

  it('is false for Kong Manager', () => {
    expect(hideNewRedis({
      app: 'kongManager',
      apiBaseUrl: '/kong-manager',
      workspace: 'default',
      isKonnectManagedRedisEnabled: true,
    })).toBe(false)
  })
})
