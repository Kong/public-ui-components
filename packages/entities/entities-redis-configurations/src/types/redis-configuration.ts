export enum RedisType {
  HOST_PORT_CE,
  HOST_PORT_EE,
  SENTINEL,
  CLUSTER,
}

export enum PartialType {
  REDIS_CE = 'redis-ce',
  REDIS_EE = 'redis-ee',
}

export enum AuthProvider {
  AWS = 'aws',
  GCP = 'gcp',
  AZURE = 'azure',
  OAUTH = 'oauth',
}

export enum OauthAuthMethod {
  CLIENT_SECRET_BASIC = 'client_secret_basic',
  CLIENT_SECRET_JWT = 'client_secret_jwt',
  CLIENT_SECRET_POST = 'client_secret_post',
}

export enum OauthGrantType {
  CLIENT_CREDENTIALS = 'client_credentials',
  PASSWORD = 'password',
}

export enum OauthClientSecretJwtAlg {
  HS256 = 'HS256',
  HS512 = 'HS512',
}

export type SentinelNode = {
  host: string
  port: number
}

export type ClusterNode = {
  ip: string
  port: number
}

export type RedisConfigurationDTO = {
  name: string
  type: PartialType
  tags: string[]
  config: RedisConfigurationConfigDTO
}

export type RedisConfigurationConfigDTO = {
  cluster_max_redirections: number | null
  cluster_nodes: ClusterNode[] | null
  connect_timeout: number | null
  connection_is_proxied: boolean | null
  database: number | null
  host: string | null
  keepalive_backlog: number | null
  keepalive_pool_size: number | null
  password: string | null
  port: number | string | null
  timeout: number | null
  read_timeout: number | null
  send_timeout: number | null
  sentinel_master: string | null
  sentinel_nodes: SentinelNode[] | null
  sentinel_password: string | null
  sentinel_role: string | null
  sentinel_username: string | null
  server_name: string | null
  ssl_verify: boolean | null
  ssl: boolean | null
  username: string | null
  cloud_authentication: {
    auth_provider: AuthProvider | null
    aws_cache_name: string | null
    aws_region: string | null
    aws_is_serverless: boolean | null
    aws_access_key_id: string | null
    aws_secret_access_key: string | null
    aws_assume_role_arn: string | null
    aws_role_session_name: string | null
    gcp_service_account_json: string | null
    azure_client_id: string | null
    azure_client_secret: string | null
    azure_tenant_id: string | null
    oauth?: {
      auth_method: OauthAuthMethod | null
      client_id: string | null
      client_secret: string | null
      client_secret_jwt_alg: OauthClientSecretJwtAlg | null
      grant_type: OauthGrantType | null
      password: string | null
      redis_username: string | null
      redis_username_claim: string | null
      scopes: string[] | null
      ssl_verify: boolean | null
      timeout: number | null
      token_endpoint: string | null
      token_headers: Record<string, string> | null
      token_post_args: Record<string, string> | null
      username: string | null
    } | null
  } | null
}

export type RedisConfigurationResponse = RedisConfigurationDTO & {
  created_at: string | number
  id: string
  updated_at: string | number
}

export type Identifiable<T> = T & { id: string }
