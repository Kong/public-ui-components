import { computed, reactive } from 'vue'

import { Mode } from '../types'
import { shallowCopyWithoutId } from '../helpers'

import type { RedisConfigurationFormState } from '../types'

export type Options = {
  partialId?: string
}

export const useRedisConfigurationForm = (options: Options) => {
  const { partialId } = options
  const isEdit = !!partialId
  const form = reactive<RedisConfigurationFormState>({
    fields: {
      name: '',
      mode: Mode.HOST_PORT_OPEN_SOURCE,
      port: 6379,
      host: '127.0.0.1',
      database: 0,
      username: '',
      password: '',
      ssl: false,
      ssl_verify: false,
      server_name: '',
      connect_timeout: 2000,
      send_timeout: 2000,
      read_timeout: 2000,
      sentinel_username: '',
      sentinel_password: '',
      keepalive_pool_size: 256,
      keepalive_backlog: 0,
      sentinel_master: '',
      sentinel_nodes: [],
      cluster_nodes: [],
      cluster_max_redirections: 0,
      connection_is_proxied: false,
      timeout: 2000,
    },
    readonly: false,
    errorMessage: '',
  })

  const canSubmit = computed(() => {
    if (!form.fields.name.length) {
      return false
    }

    switch (form.fields.mode) {
      case Mode.HOST_PORT_OPEN_SOURCE:
        return !!form.fields.name.length
      case Mode.HOST_PORT_ENTERPRISE:
        return !!form.fields.name.length
      case Mode.CLUSTER:
        return !!form.fields.name.length
      case Mode.SENTINEL:
        return !!form.fields.name.length
      default:
        throw new Error('Invalid mode')
    }
  })

  const payload = computed(() => {
    // todo: remove non-required and non-default values
    switch (form.fields.mode) {
      case Mode.HOST_PORT_OPEN_SOURCE:
        return {
          name: form.fields.name,
          mode: form.fields.mode,
          host: form.fields.host,
          port: form.fields.port,
          timeout: form.fields.timeout,
          username: form.fields.username,
          database: form.fields.database,
          password: form.fields.password,
          ssl: form.fields.ssl,
          ssl_verify: form.fields.ssl_verify,
          server_name: form.fields.server_name,
        }
      case Mode.HOST_PORT_ENTERPRISE:
        return {
          name: form.fields.name,
          mode: form.fields.mode,
          host: form.fields.host,
          port: form.fields.port,
          timeout: form.fields.timeout,
          username: form.fields.username,
          database: form.fields.database,
          password: form.fields.password,
          ssl: form.fields.ssl,
          ssl_verify: form.fields.ssl_verify,
          server_name: form.fields.server_name,
          connect_timeout: form.fields.connect_timeout,
          send_timeout: form.fields.send_timeout,
          read_timeout: form.fields.read_timeout,
          keepalive_pool_size: form.fields.keepalive_pool_size,
          keepalive_backlog: form.fields.keepalive_backlog,
          connection_is_proxied: form.fields.connection_is_proxied,
        }
      case Mode.CLUSTER:
        return {
          name: form.fields.name,
          mode: form.fields.mode,
          cluster_nodes: form.fields.cluster_nodes.map(shallowCopyWithoutId),
          cluster_max_redirections: form.fields.cluster_max_redirections,
          timeout: form.fields.timeout,
          username: form.fields.username,
          password: form.fields.password,
          ssl: form.fields.ssl,
          ssl_verify: form.fields.ssl_verify,
          server_name: form.fields.server_name,
          connect_timeout: form.fields.connect_timeout,
          send_timeout: form.fields.send_timeout,
          read_timeout: form.fields.read_timeout,
          keepalive_pool_size: form.fields.keepalive_pool_size,
          keepalive_backlog: form.fields.keepalive_backlog,
          connection_is_proxied: form.fields.connection_is_proxied,
        }
      case Mode.SENTINEL:
        return {
          name: form.fields.name,
          mode: form.fields.mode,
          sentinel_master: form.fields.sentinel_master,
          sentinel_nodes: form.fields.sentinel_nodes.map(shallowCopyWithoutId),
          timeout: form.fields.timeout,
          username: form.fields.username,
          password: form.fields.password,
          ssl: form.fields.ssl,
          ssl_verify: form.fields.ssl_verify,
          server_name: form.fields.server_name,
          connect_timeout: form.fields.connect_timeout,
          send_timeout: form.fields.send_timeout,
          read_timeout: form.fields.read_timeout,
          keepalive_pool_size: form.fields.keepalive_pool_size,
          keepalive_backlog: form.fields.keepalive_backlog,
          connection_is_proxied: form.fields.connection_is_proxied,
        }
      default:
        throw new Error('Invalid mode')
    }
  })

  return {
    form,
    canSubmit,
    payload,
    isEdit,
  }
}
