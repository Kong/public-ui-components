import { describe, expect, it } from 'vitest'

import { inferRedisPartialManagedSource, isKonnectManagedRedisEnabled, pickCloudAuthFields } from './helpers'
import { AuthProvider, REDIS_CONFIGURATION_SOURCE } from './types'

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

describe('pickCloudAuthFields', () => {
  it('returns null when no auth provider is selected', () => {
    expect(pickCloudAuthFields(undefined)).toBeNull()
    expect(pickCloudAuthFields({ aws_is_serverless: false })).toBeNull()
  })

  it('whitelists only AWS fields for the aws provider', () => {
    const picked = pickCloudAuthFields({
      auth_provider: AuthProvider.AWS,
      aws_cache_name: 'cache',
      aws_is_serverless: true,
      azure_client_id: 'should-be-dropped',
    })
    expect(picked).toEqual({
      auth_provider: AuthProvider.AWS,
      aws_cache_name: 'cache',
      aws_region: undefined,
      aws_is_serverless: true,
      aws_access_key_id: undefined,
      aws_secret_access_key: undefined,
      aws_assume_role_arn: undefined,
      aws_role_session_name: undefined,
    })
  })

  it('returns only the auth provider for the oauth provider (oauth record is standardized separately)', () => {
    const picked = pickCloudAuthFields({
      auth_provider: AuthProvider.OAUTH,
      aws_is_serverless: false,
      oauth: {
        auth_method: undefined,
        grant_type: undefined,
        client_secret_jwt_alg: undefined,
        ssl_verify: true,
        scopes: [],
        token_headers: {},
        token_post_args: {},
        token_endpoint: 'https://example.com/token',
      } as any,
    })
    expect(picked).toEqual({ auth_provider: AuthProvider.OAUTH })
  })
})
