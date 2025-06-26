import type { FreeFormPluginData } from '../../../types/plugins/free-form'

export type RequestCalloutPlugin = FreeFormPluginData<RequestCallout>

export interface RequestCallout {
  callouts: Callout[]
  cache: Cache
  upstream: Upstream
}

/************************************************
 *                     Cache                    *
 ************************************************/

export interface Cache {
  strategy: 'memory' | 'redis' | 'off'
  memory: {
    dictionary_name: string
  }
  redis: Redis
  cache_ttl?: number | null
}

export interface Redis {
  host?: string | null
  port?: number | null
  connect_timeout?: number | null
  send_timeout?: number | null
  read_timeout?: number | null
  /**
   * @description referenceable: true
   */
  username?: string | null
  /**
   * @description referenceable: true
   */
  password?: string | null
  /**
   * @description referenceable: true
   */
  sentinel_username?: string | null
  /**
   * @description referenceable: true
   */
  sentinel_password?: string | null
  database?: number | null
  keepalive_pool_size?: number | null
  keepalive_backlog?: number | null
  sentinel_master?: string | null
  sentinel_role?: 'master' | 'slave' | 'any' | null
  sentinel_nodes?: RedisSentinelNode[] | null // `"len_min": 1`
  cluster_nodes?: RedisClusterNode[] | null // `"len_min": 1`
  ssl?: boolean
  ssl_verify?: boolean
  server_name?: string | null
  cluster_max_redirections?: number | null
  connection_is_proxied?: boolean
}

export type RedisPartialType = 'redis-ce' | 'redis-ee'

export type RedisTypeDisplay = 'Host/Port' | 'Sentinel' | 'Cluster'

export interface RedisConfig {
  name: string
  type: RedisPartialType
  config: Redis
}

export interface FlattendRedisConfigurationFields extends Redis {
  name: string
  created_at: string
  updated_at: string
  type: RedisPartialType
}

export interface RedisSentinelNode {
  host: string
  port?: number | null
}

export interface RedisClusterNode {
  ip: string
  port?: number | null
}

/************************************************
 *                    Callout                   *
 ************************************************/

export const CalloutId: unique symbol = Symbol()

export interface Callout {
  [CalloutId]?: string // used as key, will be removed from final data
  name: string
  depends_on: string[]
  request: CalloutRequest
  response: CalloutResponse
  cache: CalloutCache
}

export interface CalloutRequest {
  url: string
  method: string
  headers: CalloutRequestHeaders
  query: CalloutRequestQuery
  body: CalloutRequestBody
  http_opts: CalloutRequestHttpOpts
  error: CalloutRequestError
  by_lua?: string | null
}

export interface CalloutRequestHeaders {
  forward?: boolean
  custom?: Record<string, string>
}

export interface CalloutRequestQuery {
  forward?: boolean
  custom?: Record<string, string>
}

export interface CalloutRequestBody {
  forward?: boolean
  decode?: boolean
  custom?: Record<string, string>
}

export interface CalloutRequestHttpOpts {
  ssl_verify?: boolean
  ssl_server_name?: string | null
  timeouts?: CalloutRequestTimeouts | null
  proxy?: CalloutRequestProxy | null
}

export interface CalloutRequestTimeouts {
  connect?: number | null
  write?: number | null
  read?: number | null
}

export interface CalloutRequestProxy {
  http_proxy?: string | null
  https_proxy?: string | null
  auth_username?: string | null
  auth_password?: string | null
}

export interface CalloutRequestError {
  on_error?: 'retry' | 'fail' | 'continue' | null
  retries?: number | null
  http_statuses?: Array<number | null> | null
  error_response_code?: number | null
  error_response_msg?: string | null
}

export interface CalloutResponse {
  headers: CalloutResponseHeaders
  body: CalloutResponseBody
  by_lua?: string | null
}

export interface CalloutResponseHeaders {
  store?: boolean
}

export interface CalloutResponseBody {
  store?: boolean
  decode?: boolean
}

export interface CalloutCache {
  bypass?: boolean
}

/************************************************
 *                   Upstream                   *
 ************************************************/

export interface Upstream {
  headers: {
    forward?: boolean
    custom?: Record<string, string>
  }
  query: {
    forward?: boolean
    custom?: Record<string, string>
  }
  body: {
    forward?: boolean
    decode?: boolean
    custom?: Record<string, string>
  }
  by_lua?: string | null
}

