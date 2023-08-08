import { BaseFormConfig, KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import { RouteLocationRaw } from 'vue-router'

export interface BaseVaultFormConfig extends Omit<BaseFormConfig, 'cancelRoute'>{
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
}

/** Konnect Vault form config */
export interface KonnectVaultFormConfig extends Omit<KonnectBaseFormConfig, 'cancelRoute'>, BaseVaultFormConfig {}

/** Kong Manager Vault form config */
export interface KongManagerVaultFormConfig extends Omit<KongManagerBaseFormConfig, 'cancelRoute'>, BaseVaultFormConfig { }

export enum VaultProviders {
  AWS = 'aws',
  GCP = 'gcp',
  HCV = 'hcv',
  KONG = 'env',
  AZURE = 'azure'
}

export enum VaultAuthMethods {
  TOKEN = 'token',
  K8S = 'kubernetes'
}

export interface KongVaultConfig {
  prefix: string
}

export interface AWSVaultConfig {
  region: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
}

export interface GCPVaultConfig {
  project_id: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
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
  kube_api_token_file?: string
  ttl?: number
  neg_ttl?: number
  resurrect_ttl?: number
}

export interface AzureVaultConfig {
  location: string
  vault_uri: string
  instance_metadata_host: string
}

// allow for nullish values in payload because Kong Admin API treats null as an empty value
// in case it's an empty string, it will be treated as a value and must have length > 0
export interface HCVVaultConfigPayload extends Omit<HCVVaultConfig, 'namespace' | 'token'> {
  namespace: string | null
  token?: string | null
}

export interface VaultPayload {
  name: VaultProviders
  prefix: string
  description: string | null
  tags: string[],
  config: KongVaultConfig | AWSVaultConfig | GCPVaultConfig | HCVVaultConfigPayload | AzureVaultConfig
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
