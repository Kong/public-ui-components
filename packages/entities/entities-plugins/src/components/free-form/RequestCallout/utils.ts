import type {
  Cache,
  Callout,
  CalloutCache,
  CalloutRequest,
  CalloutRequestBody,
  CalloutRequestError,
  CalloutRequestHeaders,
  CalloutRequestHttpOpts,
  CalloutRequestProxy,
  CalloutRequestQuery,
  CalloutRequestTimeouts,
  CalloutResponse,
  RedisClusterNode,
  Redis,
  RequestCallout,
  Upstream,
  RedisSentinelNode,
  CalloutResponseHeaders,
  CalloutResponseBody,
} from './types'

export function getDefaultRequestCallout(): RequestCallout {
  return {
    cache: getDefaultCache(),
    callouts: [],
    upstream: getDefaultUpstream(),
  }
}

/************************************************
 *                     Cache                    *
 ************************************************/

export function getDefaultCache(): Cache {
  return {
    strategy: 'memory',
    memory: {
      dictionary_name: 'kong_db_cache',
    },
    redis: getDefaultRedis(),
    cache_ttl: 300,
  }
}

export function getDefaultRedis(): Redis {
  return {
    host: '127.0.0.1',
    port: 6379,
    connect_timeout: 2000,
    send_timeout: 2000,
    read_timeout: 2000,
    database: 0,
    keepalive_pool_size: 256,
    ssl: false,
    ssl_verify: false,
    cluster_max_redirections: 5,
    connection_is_proxied: false,
  }
}

export function getDefaultRedisSentinelNode(): RedisSentinelNode {
  return {
    host: '127.0.0.1',
    port: 6379,
  }
}

export function getDefaultRedisClusterNode(): RedisClusterNode {
  return {
    ip: '127.0.0.1',
    port: 6379,
  }
}

/************************************************
 *                    Callout                   *
 ************************************************/

export function getDefaultCallout(): Callout {
  return {
    name: '',
    depends_on: [],
    request: getDefaultCalloutRequest(),
    response: getDefaultCalloutResponse(),
    cache: getDefaultCalloutCache(),
  }
}

export function getDefaultCalloutRequest(): CalloutRequest {
  return {
    url: '',
    method: 'GET',
    headers: getDefaultCalloutRequestHeaders(),
    query: getDefaultCalloutRequestQuery(),
    body: getDefaultCalloutRequestBody(),
    http_opts: getDefaultCalloutRequestHttpOpts(),
    error: getDefaultCalloutRequestError(),
    by_lua: '',
  }
}

export function getDefaultCalloutRequestHeaders(): CalloutRequestHeaders {
  return {
    forward: false,
    custom: {},
  }
}

export function getDefaultCalloutRequestQuery(): CalloutRequestQuery {
  return {
    forward: false,
    custom: {},
  }
}

export function getDefaultCalloutRequestBody(): CalloutRequestBody {
  return {
    forward: false,
    decode: false,
    custom: {},
  }
}

export function getDefaultCalloutRequestHttpOpts(): CalloutRequestHttpOpts {
  return {
    ssl_verify: true,
    ssl_server_name: '',
    timeouts: getDefaultCalloutRequestHttpOptsTimeouts(),
    proxy: getDefaultCalloutRequestHttpOptsProxy(),
  }
}

export function getDefaultCalloutRequestHttpOptsTimeouts(): CalloutRequestTimeouts {
  return {
    connect: undefined,
    write: undefined,
    read: undefined,
  }
}

export function getDefaultCalloutRequestHttpOptsProxy(): CalloutRequestProxy {
  return {
    auth_username: '',
    auth_password: '',
    http_proxy: '',
    https_proxy: '',
  }
}

export function getDefaultCalloutRequestError(): CalloutRequestError {
  return {
    on_error: 'retry',
    retries: 2,
    http_statuses: [],
    error_response_code: 400,
    error_response_msg: 'service callout error',
  }
}

export function getDefaultCalloutResponse(): CalloutResponse {
  return {
    headers: getDefaultCalloutResponseHeaders(),
    body: getDefaultCalloutResponseBody(),
    by_lua: '',
  }
}

export function getDefaultCalloutResponseHeaders(): CalloutResponseHeaders {
  return {
    store: false,
  }
}

export function getDefaultCalloutResponseBody(): CalloutResponseBody {
  return {
    store: true,
    decode: false,
  }
}

export function getDefaultCalloutCache(): CalloutCache {
  return {
    bypass: false,
  }
}

/************************************************
 *                   Upstream                   *
 ************************************************/

export function getDefaultUpstream(): Upstream {
  return {
    headers: {
      forward: true,
    },
    query: {
      forward: true,
    },
    body: {
      forward: true,
      decode: true,
    },
  }
}
