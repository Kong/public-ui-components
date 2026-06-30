import { VaultProviders, VaultAuthMethods } from './types'
import type { AiVaultPayload, VaultPayload } from './types'

/**
 * Maps the form's internal (Kong API Gateway) HashiCorp field names to the
 * Kong AI Gateway field names, keyed by `auth_method`. Common fields (see
 * HCV_COMMON_FIELDS) are identical on both sides and handled separately.
 *
 * This table is the single source of truth for HCV renaming in both directions.
 */
export const HCV_FIELD_MAP: Record<string, Record<string, string>> = {
  [VaultAuthMethods.TOKEN]: {
    token: 'token',
  },
  [VaultAuthMethods.CERT]: {
    cert_auth_cert: 'cert',
    cert_auth_cert_key: 'key',
    cert_auth_role_name: 'role_name',
  },
  [VaultAuthMethods.JWT]: {
    jwt_role: 'role',
    oauth2_token_endpoint: 'token_endpoint',
    oauth2_client_id: 'client_id',
    oauth2_client_secret: 'client_secret',
    oauth2_audiences: 'audiences',
  },
  [VaultAuthMethods.APP_ROLE]: {
    approle_auth_path: 'path',
    approle_response_wrapping: 'response_wrapping',
    approle_role_id: 'role_id',
    approle_secret_id: 'secret_id',
    approle_secret_id_file: 'secret_id_file',
  },
  [VaultAuthMethods.K8S]: {
    kube_role: 'role',
    kube_auth_path: 'path',
    kube_api_token_file: 'api_token_file',
  },
  [VaultAuthMethods.GCP_IAM]: {
    gcp_auth_role: 'role',
    gcp_service_account: 'service_account',
    gcp_jwt_exp: 'jwt_exp',
    gcp_login_path: 'login_path',
  },
  [VaultAuthMethods.GCP_GCE]: {
    gcp_auth_role: 'role',
    gcp_login_path: 'login_path',
  },
  [VaultAuthMethods.AWS_IAM]: {
    aws_auth_role: 'role',
    aws_auth_region: 'region',
    aws_login_path: 'login_path',
    aws_access_key_id: 'access_key_id',
    aws_secret_access_key: 'secret_access_key',
    aws_sts_endpoint_url: 'sts_endpoint_url',
    aws_assume_role_arn: 'assume_role_arn',
    aws_role_session_name: 'role_session_name',
  },
  [VaultAuthMethods.AWS_EC2]: {
    aws_auth_role: 'role',
    aws_auth_nonce: 'nonce',
    aws_login_path: 'login_path',
  },
  [VaultAuthMethods.AZURE]: {
    azure_auth_role: 'role',
    azure_login_path: 'login_path',
  },
}

/** HashiCorp config fields that share the same name on both APIs. */
const HCV_COMMON_FIELDS = [
  'protocol', 'host', 'port', 'mount', 'kv', 'namespace',
  'ssl_verify', 'auth_method', 'base64_decode', 'ttl', 'neg_ttl', 'resurrect_ttl',
]

const invert = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]))

const isNullish = (v: unknown): boolean => v === null || v === undefined

/** Shallow-remove keys whose value is null or undefined. */
export const stripNullish = (obj: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => !isNullish(v)))

/**
 * Convert the gateway-shaped HCV config (already pruned by VaultForm.getPayload to
 * the active auth method's fields) into the AI Gateway shape: keep common fields,
 * rename method-specific fields, and drop null/undefined (the gateway sends e.g.
 * `token: null` for kubernetes, which AI Gateway does not accept).
 */
const toAiHcvConfig = (gwConfig: Record<string, any>): Record<string, any> => {
  const map = HCV_FIELD_MAP[gwConfig.auth_method as string] ?? {}
  const out: Record<string, any> = {}

  for (const key of HCV_COMMON_FIELDS) {
    if (key in gwConfig) out[key] = gwConfig[key]
  }
  for (const [gwName, aiName] of Object.entries(map)) {
    if (gwName in gwConfig) out[aiName] = gwConfig[gwName]
  }

  return stripNullish(out)
}

/**
 * Forward mapper: gateway-shaped request body (the existing VaultForm.getPayload
 * output) → Kong AI Gateway vault request body.
 * - provider `name` → `type`; identifier `prefix` → `name`
 * - `tags` dropped; `labels` passed through when present
 * - hcv config field names remapped per auth method; conjur drops `auth_method`
 * - null/undefined config values omitted
 */
export const toAiGatewayVaultPayload = (payload: VaultPayload): AiVaultPayload => {
  const provider = payload.name
  let config: Record<string, any> = (payload.config ?? {}) as Record<string, any>

  if (provider === VaultProviders.HCV) {
    config = toAiHcvConfig(config)
  } else if (provider === VaultProviders.CONJUR) {
    // AI Gateway conjur has no `auth_method` field (gateway hardcodes 'api_key').
    const rest = { ...config }
    delete rest.auth_method
    config = stripNullish(rest)
  } else {
    config = stripNullish(config)
  }

  return {
    type: provider,
    name: payload.prefix,
    // AI Gateway description is a non-nullable string; coerce the gateway's `null`
    // (used for an empty description) to an empty string.
    description: payload.description ?? '',
    config,
  }
}

/** Reverse the HCV field renaming for a fetched AI Gateway config. */
const fromAiHcvConfig = (aiConfig: Record<string, any>): Record<string, any> => {
  const reverse = invert(HCV_FIELD_MAP[aiConfig.auth_method as string] ?? {})
  const out: Record<string, any> = {}
  for (const [key, value] of Object.entries(aiConfig)) {
    out[reverse[key] ?? key] = value
  }
  return out
}

/**
 * Reverse mapper: a fetched Kong AI Gateway vault → gateway-shaped record that the
 * form / list / config card already understand.
 * - `type` → `name`; `name` → `prefix`
 * - hcv config field names remapped back; conjur re-injects `auth_method: 'api_key'`
 * - `config_store_id` preserved for konnect
 * - `labels` passed through from the API response
 */
export const fromAiGatewayVault = (apiVault: Record<string, any>): Record<string, any> => {
  const provider = apiVault?.type
  let config: Record<string, any> = apiVault?.config ? { ...apiVault.config } : {}

  if (provider === VaultProviders.HCV) {
    config = fromAiHcvConfig(config)
  } else if (provider === VaultProviders.CONJUR) {
    config = { ...config, auth_method: 'api_key' }
  }

  return {
    id: apiVault?.id,
    created_at: apiVault?.created_at,
    updated_at: apiVault?.updated_at,
    name: provider,
    prefix: apiVault?.name,
    description: apiVault?.description ?? '',
    labels: apiVault?.labels ?? {},
    config,
  }
}
