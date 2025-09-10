import { isEqual } from 'lodash-es'

export interface SchemaRegistry {
  confluent?: ConfluentConfig | null
}

export interface ConfluentConfig {
  authentication?: AuthenticationConfig
  ssl_verify?: boolean
}

export interface AuthenticationConfig {
  mode?: 'none' | 'basic' | 'oauth2'
  basic?: BasicAuthConfig
  oauth2?: OAuth2Config
  oauth2_client?: OAuth2ClientConfig
}

export interface BasicAuthConfig {
  username?: string
  password?: string
}

export interface OAuth2Config {
  token_endpoint?: string
  token_headers?: Record<string, string>
  token_post_args?: Record<string, string>
  grant_type?: 'client_credentials' | 'password'
  client_id?: string
  client_secret?: string
  username?: string
  password?: string
  scopes?: string[]
  audience?: string[]
}

export interface OAuth2ClientConfig {
  auth_method?: 'client_secret_post' | 'client_secret_basic' | 'client_secret_jwt' | 'none'
  client_secret_jwt_alg?: 'HS512' | 'HS256'
  http_version?: number
  http_proxy?: string
  http_proxy_authorization?: string
  https_proxy?: string
  https_proxy_authorization?: string
  no_proxy?: string
  timeout?: number
  keep_alive?: boolean
  ssl_verify?: boolean
}

const defaultConfluent: ConfluentConfig = { authentication: { mode: 'none' }, ssl_verify: true }
const emptyConfluent: ConfluentConfig = { authentication: { basic: {} } }

export const stripEmptyBasicFields = (schemaRegistry: SchemaRegistry) => {
  // Remove the default values if the mode is 'none'
  if (schemaRegistry.confluent?.authentication?.mode === 'none') {
    delete schemaRegistry.confluent.authentication.oauth2
    delete schemaRegistry.confluent.authentication.oauth2_client
    delete schemaRegistry.confluent.authentication.basic
  }

  // Remove the default values if the mode is 'basic'
  if (schemaRegistry.confluent?.authentication?.mode === 'basic') {
    delete schemaRegistry.confluent.authentication.oauth2
    delete schemaRegistry.confluent.authentication.oauth2_client
  }

  // Remove the default values if the mode is 'oauth2'
  if (schemaRegistry.confluent?.authentication?.mode === 'oauth2') {
    delete schemaRegistry.confluent.authentication.basic
  }

  // Remove the entire confluent if all are empty
  if (
    isEqual(schemaRegistry.confluent, defaultConfluent)
    || isEqual(schemaRegistry.confluent, emptyConfluent)
  ) {
    schemaRegistry.confluent = null
  }
}
