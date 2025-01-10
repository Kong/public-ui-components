import { computed, reactive, ref, watch } from 'vue'

import { getRedisType, mapRedisTypeToPartialType, shallowCopyWithoutId } from '../helpers'
import { RedisType } from '../types'
import { DEFAULT_REDIS_TYPE } from '../constants'

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
      type: mapRedisTypeToPartialType(DEFAULT_REDIS_TYPE),
      config: {
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
    },
    readonly: false,
    errorMessage: '',
  })
  const userSelectedRedisType = ref<RedisType>()
  const redisType = computed(() => {
    if (isEdit) {
      return getRedisType(form.fields)
    }
    if (userSelectedRedisType.value) {
      return userSelectedRedisType.value
    }
    return DEFAULT_REDIS_TYPE
  })

  watch(redisType, (newValue) => {
    form.fields.type = mapRedisTypeToPartialType(newValue)
  })

  const canSubmit = computed(() => {
    if (!form.fields.name.length) {
      return false
    }

    const { config } = form.fields

    switch (redisType.value) {
      case RedisType.HOST_PORT_CE:
        return config.host.length > 0 && config.port > 0
      case RedisType.HOST_PORT_EE:
        return config.host.length > 0 && config.port > 0
      case RedisType.CLUSTER:
        return !!config.cluster_nodes.length && config.cluster_nodes.every((node) => node.ip.length > 0 && node.port > 0)
      case RedisType.SENTINEL:
        return !!config.sentinel_nodes.length && config.sentinel_nodes.every((node) => node.host.length > 0 && node.port > 0)
      default:
        throw new Error('Invalid redis type')
    }
  })

  const payload = computed(() => {
    switch (redisType.value) {
      case RedisType.HOST_PORT_CE:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            host: form.fields.config.host,
            port: form.fields.config.port,
            timeout: form.fields.config.timeout,
            username: form.fields.config.username,
            database: form.fields.config.database,
            password: form.fields.config.password,
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: form.fields.config.server_name,
          },
        }
      case RedisType.HOST_PORT_EE:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            host: form.fields.config.host,
            port: form.fields.config.port,
            timeout: form.fields.config.timeout,
            username: form.fields.config.username,
            database: form.fields.config.database,
            password: form.fields.config.password,
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: form.fields.config.server_name,
            connect_timeout: form.fields.config.connect_timeout,
            send_timeout: form.fields.config.send_timeout,
            read_timeout: form.fields.config.read_timeout,
            keepalive_pool_size: form.fields.config.keepalive_pool_size,
            keepalive_backlog: form.fields.config.keepalive_backlog,
            connection_is_proxied: form.fields.config.connection_is_proxied,
          },
        }
      case RedisType.CLUSTER:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            cluster_nodes: form.fields.config.cluster_nodes.map(shallowCopyWithoutId),
            cluster_max_redirections: form.fields.config.cluster_max_redirections,
            timeout: form.fields.config.timeout,
            username: form.fields.config.username,
            password: form.fields.config.password,
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: form.fields.config.server_name,
            connect_timeout: form.fields.config.connect_timeout,
            send_timeout: form.fields.config.send_timeout,
            read_timeout: form.fields.config.read_timeout,
            keepalive_pool_size: form.fields.config.keepalive_pool_size,
            keepalive_backlog: form.fields.config.keepalive_backlog,
            connection_is_proxied: form.fields.config.connection_is_proxied,
          },
        }
      case RedisType.SENTINEL:
        return {
          name: form.fields.name,
          type: form.fields.type,
          config: {
            sentinel_master: form.fields.config.sentinel_master,
            sentinel_nodes: form.fields.config.sentinel_nodes.map(shallowCopyWithoutId),
            timeout: form.fields.config.timeout,
            username: form.fields.config.username,
            password: form.fields.config.password,
            ssl: form.fields.config.ssl,
            ssl_verify: form.fields.config.ssl_verify,
            server_name: form.fields.config.server_name,
            connect_timeout: form.fields.config.connect_timeout,
            send_timeout: form.fields.config.send_timeout,
            read_timeout: form.fields.config.read_timeout,
            keepalive_pool_size: form.fields.config.keepalive_pool_size,
            keepalive_backlog: form.fields.config.keepalive_backlog,
            connection_is_proxied: form.fields.config.connection_is_proxied,
          },
        }
      default:
        throw new Error('Invalid redis type')
    }
  })

  return {
    form,
    canSubmit,
    payload,
    isEdit,
    redisType,
    userSelectedRedisType,
  }
}
