import { describe, expect, it } from 'vitest'

import { hideNewRedis } from './hideNewRedisConfiguration'

describe('hideNewRedis', () => {
  it('is true for Konnect Cloud Gateway', () => {
    expect(hideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isCloudGateway: true,
    })).toBe(true)
  })

  it('is false for Konnect on a non-Cloud Gateway', () => {
    expect(hideNewRedis({
      app: 'konnect',
      apiBaseUrl: '/us/kong-api',
      controlPlaneId: 'cp-1',
      isCloudGateway: false,
    })).toBe(false)
  })

  it('is false for Kong Manager', () => {
    expect(hideNewRedis({
      app: 'kongManager',
      apiBaseUrl: '/kong-manager',
      workspace: 'default',
    })).toBe(false)
  })
})
