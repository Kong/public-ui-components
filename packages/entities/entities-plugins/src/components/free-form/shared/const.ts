import type { ComputedRef, InjectionKey } from 'vue'
import type { PartialInfo } from './types/types'

export const REDIS_PARTIAL_INFO: InjectionKey<PartialInfo> = Symbol('redis-partial-info')
export const FORM_EDITING: InjectionKey<ComputedRef<boolean>> = Symbol('free-form-editing')

export const partialEndpoints = {
  konnect: {
    getOne: '/v2/control-planes/{controlPlaneId}/core-entities/partials/{id}',
    getAll: '/v2/control-planes/{controlPlaneId}/core-entities/partials',
  },
  kongManager: {
    getOne: '/{workspace}/partials/{id}',
    getAll: '/{workspace}/partials',
  },
}

// Redis configuration fields order
export const fieldsOrder = [
  'host', 'port', 'connection_is_proxied', 'database', 'username', 'password',
  'sentinel_master', 'sentinel_role', 'sentinel_nodes', 'sentinel_username', 'sentinel_password',
  'cluster_nodes', 'cluster_max_redirections', 'ssl', 'ssl_verify', 'server_name',
  'keepalive_backlog', 'keepalive_pool_size', 'read_timeout', 'send_timeout', 'connect_timeout',
]
