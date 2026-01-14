
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { ClusterNode, Identifiable, PartialType, SentinelNode, AuthProvider } from './redis-configuration'

export interface BaseRedisConfigurationFormConfig {
  /**
   * Show/hide cloud authentication configuration fields
   */
  cloudAuthAvailable?: boolean
  /**
   * Whether the port field can accept vault references
   */
  isPortReferenceable?: boolean
  /**
   * Whether the host field can accept vault references
   */
  isHostReferenceable?: boolean
  /**
   * Whether the server_name field can accept vault references
   */
  isServerNameReferenceable?: boolean
  /**
   * Whether the above three fields can accept vault references in Redis CE partials
   */
  isCEFieldsReferenceable?: boolean
}

export interface KonnectRedisConfigurationFormConfig extends KonnectBaseFormConfig, BaseRedisConfigurationFormConfig { }
export interface KongManagerRedisConfigurationFormConfig extends KongManagerBaseFormConfig, BaseRedisConfigurationFormConfig { }

export interface RedisConfigurationFields {
  name: string
  type: PartialType
  tags: string
  config: {
    cluster_max_redirections: number
    cluster_nodes: Array<Identifiable<ClusterNode>>
    connect_timeout: number
    connection_is_proxied: boolean
    database: number
    host?: string
    keepalive_backlog: number
    keepalive_pool_size: number
    password: string
    port?: number | string
    read_timeout: number
    send_timeout: number
    sentinel_master?: string
    sentinel_nodes: Array<Identifiable<SentinelNode>>
    sentinel_password: string
    sentinel_role?: 'master' | 'slave' | 'any'
    sentinel_username: string
    server_name?: string
    ssl_verify: boolean
    ssl: boolean
    timeout?: number
    username: string
    cloud_authentication?: {
      auth_provider?: AuthProvider | null
      aws_cache_name?: string
      aws_region?: string
      aws_is_serverless: boolean
      aws_access_key_id?: string
      aws_secret_access_key?: string
      aws_assume_role_arn?: string
      aws_role_session_name?: string
      gcp_service_account_json?: string
      azure_client_id?: string
      azure_client_secret?: string
      azure_tenant_id?: string
    }
  }
}

export interface RedisConfigurationFormState {
  fields: RedisConfigurationFields
  readonly: boolean
  errorMessage: string
}
