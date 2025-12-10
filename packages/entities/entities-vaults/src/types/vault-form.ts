import type { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { RouteLocationRaw } from 'vue-router'

export interface BaseVaultFormConfig extends Omit<BaseFormConfig, 'cancelRoute'> {
  /** Route to return to if canceling create/edit a Vault form */
  cancelRoute: RouteLocationRaw
  /**
   * Show/hide Azure option - mostly for Konnect to pass feature flag value
   * TODO: remove when support for Azure is added
   */
  azureVaultProviderAvailable: boolean
  /**
   * Show/hide SupportTTL option - mostly for Konnect to pass feature flag value
   * TODO: remove when support for Support TTL is added
   */
  ttl: boolean
  /**
   * Show/hide approle option and corresponding fields
   * TODO: remove when support for approle option is added
   */
  hcvAppRoleMethodAvailable?: boolean

  /**
   * Show/hide cert option and corresponding fields
   */
  hcvCertMethodAvailable?: boolean

  /**
   * Show/hide jwt option and corresponding fields
   */
  hcvJwtMethodAvailable?: boolean

  /**
  * Show/hide AWS StsEndpointUrl field
  */
  awsStsEndpointUrlAvailable?: boolean

  /**
   * Show/hide Conjur option - mostly for Konnect to pass feature flag value
   * TODO: remove when support for Conjur is added
   */
  conjurVaultProviderAvailable?: boolean

  /**
   * Show/hide Base64 field (added since 3.11)
   */
  base64FieldAvailable?: boolean
}

/** Konnect Vault form config */
export interface KonnectVaultFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseVaultFormConfig { }

/** Kong Manager Vault form config */
export interface KongManagerVaultFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseVaultFormConfig { }

export enum VaultProviders {
  AWS = 'aws',
  GCP = 'gcp',
  HCV = 'hcv',
  ENV = 'env',
  AZURE = 'azure',
  KONNECT = 'konnect',
  CONJUR = 'conjur',
}

export enum VaultAuthMethods {
  TOKEN = 'token',
  K8S = 'kubernetes',
  APP_ROLE = 'approle',
  CERT = 'cert',
  JWT = 'jwt',
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConfigStoreConfig {}

export interface KongVaultConfig {
  prefix: string
  base64_decode?: boolean
}

export interface AWSVaultConfig {
  region: string
  endpoint_url?: string
  assume_role_arn?: string
  role_session_name: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
  sts_endpoint_url?: string
  base64_decode?: boolean
}

export interface GCPVaultConfig {
  project_id: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
  base64_decode?: boolean
}

export interface HCVVaultConfig {
  protocol: string
  host: string
  port: number
  mount: string
  kv: string
  namespace: string
  auth_method: string
  token?: string
  kube_role?: string
  kube_auth_path?: string
  kube_api_token_file?: string
  approle_auth_path?: string
  approle_role_id?: string
  approle_secret_id?: string
  approle_secret_id_file?: string
  approle_response_wrapping?: boolean
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
  base64_decode?: boolean
  cert_auth_role_name?: string
  cert_auth_cert?: string
  cert_auth_cert_key?: string
  oauth2_audiences?: string
  oauth2_client_id?: string
  oauth2_client_secret?: string
  jwt_role?: string
  oauth2_token_endpoint?: string
}

export interface AzureVaultConfig {
  location: string
  vault_uri: string
  credentials_prefix: string
  type: string
  client_id?: string
  tenant_id?: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
  base64_decode?: boolean
}

export interface ConjurVaultConfig {
  endpoint_url: string
  auth_method: 'api_key'
  login?: string
  account?: string
  api_key?: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
  base64_decode?: boolean
}

// allow for nullish values in payload because Kong Admin API treats null as an empty value
// in case it's an empty string, it will be treated as a value and must have length > 0
export interface HCVVaultConfigPayload extends Omit<HCVVaultConfig, 'namespace' | 'token'> {
  namespace: string | null
  token?: string | null
}

// allow for nullish values in payload because Kong Admin API treats null as an empty value
// in case it's an empty string, it will be treated as a value and must have length > 0
export interface AzureVaultConfigPayload extends Omit<AzureVaultConfig, 'client_id' | 'tenant_id'> {
  client_id?: string | null
  tenant_id?: string | null
}

// allow for nullish values in payload because Kong Admin API treats null as an empty value
// in case it's an empty string, it will be treated as a value and must have length > 0
export interface AWSVaultConfigPayload extends Omit<AWSVaultConfig, 'endpoint_url' | 'assume_role_arn'> {
  endpoint_url?: string | null
  assume_role_arn?: string | null
}

export interface VaultPayload {
  name: VaultProviders
  prefix: string
  description: string | null
  tags: string[]
  config: ConfigStoreConfig | KongVaultConfig | GCPVaultConfig | HCVVaultConfigPayload | AzureVaultConfigPayload | AWSVaultConfigPayload
}

export interface VaultStateFields {
  prefix: string
  description: string
  tags: string
}

export interface VaultState {
  fields: VaultStateFields
  isReadonly: boolean
  errorMessage: string
}

export interface KonnectConfigStore {
  id: string
}
