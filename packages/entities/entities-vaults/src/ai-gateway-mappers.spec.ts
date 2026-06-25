import { describe, it, expect } from 'vitest'
import { toAiGatewayVaultPayload, fromAiGatewayVault, stripNullish } from './ai-gateway-mappers'
import { VaultProviders, VaultAuthMethods } from './types'
import type { VaultPayload } from './types'

const basePayload = (overrides: Partial<VaultPayload>): VaultPayload => ({
  name: VaultProviders.ENV,
  prefix: 'my-vault',
  description: 'desc',
  tags: ['a', 'b'],
  config: {},
  ...overrides,
})

describe('stripNullish', () => {
  it('removes null and undefined but keeps false / 0 / empty string', () => {
    expect(stripNullish({ a: null, b: undefined, c: false, d: 0, e: '', f: 'x' }))
      .toEqual({ c: false, d: 0, e: '', f: 'x' })
  })
})

describe('toAiGatewayVaultPayload', () => {
  it('maps top-level fields (name→type, prefix→name), drops tags, omits labels when none', () => {
    const result = toAiGatewayVaultPayload(basePayload({
      name: VaultProviders.ENV,
      prefix: 'env-vault',
      description: 'hello',
      config: { prefix: 'MY_', base64_decode: false },
    }))
    expect(result).toEqual({
      type: VaultProviders.ENV,
      name: 'env-vault',
      description: 'hello',
      config: { prefix: 'MY_', base64_decode: false },
    })
    expect(result).not.toHaveProperty('tags')
    expect(result).not.toHaveProperty('prefix')
    expect(result).not.toHaveProperty('labels')
  })

  it('coerces empty/null description to an empty string (AI Gateway description is non-nullable)', () => {
    expect(toAiGatewayVaultPayload(basePayload({ description: null as unknown as string })).description).toBe('')
    expect(toAiGatewayVaultPayload(basePayload({ description: '' })).description).toBe('')
    expect(toAiGatewayVaultPayload(basePayload({ description: 'hi' })).description).toBe('hi')
  })

  it('omits null/undefined config values (e.g. cleared aws optional + ttl fields)', () => {
    const result = toAiGatewayVaultPayload(basePayload({
      name: VaultProviders.AWS,
      config: {
        region: 'us-east-1',
        role_session_name: 'KongVault',
        endpoint_url: null,
        assume_role_arn: null,
        ttl: null,
        neg_ttl: null,
        resurrect_ttl: null,
      },
    }))
    expect(result.config).toEqual({ region: 'us-east-1', role_session_name: 'KongVault' })
  })

  it('keeps numeric ttl values', () => {
    const result = toAiGatewayVaultPayload(basePayload({
      name: VaultProviders.GCP,
      config: { project_id: 'p1', ttl: 60, neg_ttl: null, resurrect_ttl: null },
    }))
    expect(result.config).toEqual({ project_id: 'p1', ttl: 60 })
  })

  it('drops auth_method for conjur', () => {
    const result = toAiGatewayVaultPayload(basePayload({
      name: VaultProviders.CONJUR,
      config: { endpoint_url: 'https://c', login: 'l', account: 'a', api_key: 'k', auth_method: 'api_key' },
    }))
    expect(result.config).not.toHaveProperty('auth_method')
    expect(result.config).toEqual({ endpoint_url: 'https://c', login: 'l', account: 'a', api_key: 'k' })
  })

  it('passes config_store_id through for konnect', () => {
    const result = toAiGatewayVaultPayload(basePayload({
      name: VaultProviders.KONNECT,
      config: { config_store_id: 'cs-1' },
    }))
    expect(result).toEqual({
      type: VaultProviders.KONNECT,
      name: 'my-vault',
      description: 'desc',
      config: { config_store_id: 'cs-1' },
    })
  })

  describe('hcv field renaming per auth_method', () => {
    const common = { protocol: 'https', host: 'h', port: 8200, mount: 'secret', kv: 'v1', namespace: null, ssl_verify: true, base64_decode: false }

    it('token: keeps token, drops null namespace', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.TOKEN, token: 'tok' },
      }))
      expect(r.config).toEqual({ protocol: 'https', host: 'h', port: 8200, mount: 'secret', kv: 'v1', ssl_verify: true, base64_decode: false, auth_method: 'token', token: 'tok' })
    })

    it('kubernetes: kube_* → role/path/api_token_file and drops token:null', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.K8S, kube_role: 'kr', kube_auth_path: 'kp', kube_api_token_file: '/f', token: null },
      }))
      expect(r.config).toMatchObject({ auth_method: 'kubernetes', role: 'kr', path: 'kp', api_token_file: '/f' })
      expect(r.config).not.toHaveProperty('token')
      expect(r.config).not.toHaveProperty('kube_role')
    })

    it('cert: cert_auth_* → cert/key/role_name', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.CERT, cert_auth_cert: 'C', cert_auth_cert_key: 'K', cert_auth_role_name: 'R' },
      }))
      expect(r.config).toMatchObject({ cert: 'C', key: 'K', role_name: 'R' })
    })

    it('jwt: oauth2_*/jwt_role → client_id/client_secret/token_endpoint/audiences/role', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.JWT, oauth2_client_id: 'ci', oauth2_client_secret: 'cs', oauth2_token_endpoint: 'te', oauth2_audiences: 'aud', jwt_role: 'r' },
      }))
      expect(r.config).toMatchObject({ client_id: 'ci', client_secret: 'cs', token_endpoint: 'te', audiences: 'aud', role: 'r' })
    })

    it('aws_iam: aws_* → region/access_key_id/role etc', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.AWS_IAM, aws_auth_role: 'r', aws_auth_region: 'us-east-1', aws_access_key_id: 'ak', aws_secret_access_key: 'sk' },
      }))
      expect(r.config).toMatchObject({ role: 'r', region: 'us-east-1', access_key_id: 'ak', secret_access_key: 'sk' })
    })

    it('gcp_iam: gcp_* → role/service_account/jwt_exp/login_path', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.GCP_IAM, gcp_auth_role: 'r', gcp_service_account: 'sa', gcp_jwt_exp: 900, gcp_login_path: '/p' },
      }))
      expect(r.config).toMatchObject({ role: 'r', service_account: 'sa', jwt_exp: 900, login_path: '/p' })
    })

    it('approle: approle_* → path/role_id/secret_id/response_wrapping', () => {
      const r = toAiGatewayVaultPayload(basePayload({
        name: VaultProviders.HCV,
        config: { ...common, auth_method: VaultAuthMethods.APP_ROLE, approle_auth_path: 'ap', approle_role_id: 'ri', approle_secret_id: 'si', approle_response_wrapping: true },
      }))
      expect(r.config).toMatchObject({ path: 'ap', role_id: 'ri', secret_id: 'si', response_wrapping: true })
    })
  })
})

describe('fromAiGatewayVault', () => {
  it('maps type→name, name→prefix, preserves timestamps, returns empty labels when none', () => {
    const r = fromAiGatewayVault({
      id: 'v1', created_at: 1, updated_at: 2,
      type: VaultProviders.ENV, name: 'env-vault', description: 'd',
      config: { prefix: 'MY_' },
    })
    expect(r).toEqual({
      id: 'v1', created_at: 1, updated_at: 2,
      name: VaultProviders.ENV, prefix: 'env-vault', description: 'd',
      labels: {},
      config: { prefix: 'MY_' },
    })
  })

  it('passes through labels from the API response', () => {
    const r = fromAiGatewayVault({
      id: 'v1', type: VaultProviders.ENV, name: 'e', description: '',
      labels: { env: 'prod', team: 'platform' },
      config: {},
    })
    expect(r.labels).toEqual({ env: 'prod', team: 'platform' })
  })

  it('re-injects auth_method for conjur', () => {
    const r = fromAiGatewayVault({
      id: 'v1', type: VaultProviders.CONJUR, name: 'c', config: { endpoint_url: 'e', login: 'l', account: 'a' },
    })
    expect(r.config.auth_method).toBe('api_key')
  })

  it('preserves config_store_id for konnect', () => {
    const r = fromAiGatewayVault({ id: 'v1', type: VaultProviders.KONNECT, name: 'k', config: { config_store_id: 'cs-1' } })
    expect(r.config.config_store_id).toBe('cs-1')
  })

  it('reverses hcv field names by auth_method', () => {
    const r = fromAiGatewayVault({
      id: 'v1', type: VaultProviders.HCV, name: 'h',
      config: { protocol: 'https', host: 'h', port: 8200, mount: 'secret', kv: 'v1', auth_method: 'kubernetes', role: 'kr', path: 'kp', api_token_file: '/f' },
    })
    expect(r.config).toMatchObject({ auth_method: 'kubernetes', kube_role: 'kr', kube_auth_path: 'kp', kube_api_token_file: '/f' })
    expect(r.config).not.toHaveProperty('role')
  })
})

describe('round-trip', () => {
  it('hcv aws_iam survives forward then reverse (non-write-only fields)', () => {
    const original = basePayload({
      name: VaultProviders.HCV,
      config: { protocol: 'https', host: 'h', port: 8200, mount: 'secret', kv: 'v1', ssl_verify: true, auth_method: VaultAuthMethods.AWS_IAM, aws_auth_role: 'r', aws_auth_region: 'us-east-1' },
    })
    const ai = toAiGatewayVaultPayload(original)
    const back = fromAiGatewayVault({ id: 'x', ...ai })
    expect(back.name).toBe(VaultProviders.HCV)
    expect(back.config).toMatchObject({ auth_method: 'aws_iam', aws_auth_role: 'r', aws_auth_region: 'us-east-1', host: 'h', port: 8200 })
  })
})
