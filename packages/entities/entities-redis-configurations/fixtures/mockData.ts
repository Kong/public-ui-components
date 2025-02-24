import { PartialType, type RedisConfigurationLinkedPluginsResponse, type RedisConfigurationResponse } from '../src'
import { v4 as uuid } from 'uuid'

export const redisConfigurationCE: Readonly<RedisConfigurationResponse> = {
  created_at: '2025-02-07T00:00:00Z',
  updated_at: '2025-02-07T00:00:00Z',
  // randomized ID to avoid swrv cache in tests, otherwise cy.wait() will not resolve
  get id() {
    return uuid()
  },
  name: 'redis-config-1',
  type: PartialType.REDIS_CE,
  config: {
    cluster_max_redirections: 0,
    cluster_nodes: [],
    connect_timeout: 2031,
    connection_is_proxied: false,
    database: 0,
    host: 'localhost',
    keepalive_backlog: 0,
    keepalive_pool_size: 0,
    password: '',
    port: 6379,
    timeout: 2031,
    read_timeout: 0,
    send_timeout: 0,
    sentinel_master: '',
    sentinel_nodes: [],
    sentinel_password: '',
    sentinel_role: '',
    sentinel_username: '',
    server_name: '',
    ssl_verify: false,
    ssl: false,
    username: '',
  },
}

export const redisConfigurationHostPortEE: Readonly<RedisConfigurationResponse> = {
  created_at: '2025-02-07T00:00:00Z',
  updated_at: '2025-02-07T00:00:00Z',
  // randomized ID to avoid swrv cache in tests, otherwise cy.wait() will not resolve
  get id() {
    return uuid()
  },
  name: 'redis-config-2',
  type: PartialType.REDIS_EE,
  config: {
    cluster_max_redirections: 0,
    cluster_nodes: [],
    connect_timeout: 3000,
    connection_is_proxied: false,
    database: 0,
    host: 'localhost',
    keepalive_backlog: 0,
    keepalive_pool_size: 0,
    password: '',
    port: 6379,
    timeout: 3000,
    read_timeout: 3000,
    send_timeout: 3000,
    sentinel_master: '',
    sentinel_nodes: [],
    sentinel_password: '',
    sentinel_role: '',
    sentinel_username: '',
    server_name: '',
    ssl_verify: false,
    ssl: false,
    username: '',
  },
}

export const redisConfigurationCluster: Readonly<RedisConfigurationResponse> = {
  created_at: '2025-02-07T00:00:00Z',
  updated_at: '2025-02-07T00:00:00Z',
  // randomized ID to avoid swrv cache in tests, otherwise cy.wait() will not resolve
  get id() {
    return uuid()
  },
  name: 'redis-config-3',
  type: PartialType.REDIS_EE,
  config: {
    cluster_max_redirections: 0,
    cluster_nodes: [
      {
        ip: '127.0.0.1',
        port: 6379,
      },
    ],
    connect_timeout: 2000,
    connection_is_proxied: false,
    database: 0,
    host: 'localhost',
    keepalive_backlog: 0,
    keepalive_pool_size: 0,
    password: '',
    port: 6379,
    timeout: 2000,
    read_timeout: 0,
    send_timeout: 0,
    sentinel_master: '',
    sentinel_nodes: [],
    sentinel_password: '',
    sentinel_role: '',
    sentinel_username: '',
    server_name: '',
    ssl_verify: false,
    ssl: false,
    username: '',
  },
}

export const redisConfigurationSentinel: Readonly<RedisConfigurationResponse> = {
  created_at: '2025-02-07T00:00:00Z',
  updated_at: '2025-02-07T00:00:00Z',
  // randomized ID to avoid swrv cache in tests, otherwise cy.wait() will not resolve
  get id() {
    return uuid()
  },
  name: 'redis-config-4',
  type: PartialType.REDIS_EE,
  config: {
    cluster_max_redirections: 0,
    cluster_nodes: [],
    connect_timeout: 2000,
    connection_is_proxied: false,
    database: 0,
    host: 'localhost',
    keepalive_backlog: 0,
    keepalive_pool_size: 0,
    password: '',
    port: 6379,
    timeout: 2000,
    read_timeout: 0,
    send_timeout: 0,
    sentinel_master: 'mymaster',
    sentinel_nodes: [
      {
        host: 'localhost',
        port: 26379,
      },
    ],
    sentinel_password: '',
    sentinel_role: '',
    sentinel_username: '',
    server_name: '',
    ssl_verify: false,
    ssl: false,
    username: '',
  },
}

export const partials = {
  data: [
    redisConfigurationCE,
    redisConfigurationHostPortEE,
    redisConfigurationCluster,
    redisConfigurationSentinel,
  ],
  next: null,
}

export const links: RedisConfigurationLinkedPluginsResponse = {
  total: 1,
  data: [{ id: '1', name: 'rate-limiting' }],
  next: null,
}
